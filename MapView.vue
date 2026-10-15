<template>
  <div class="map-wrap">
    <div ref="mapEl" class="map-container"></div>
    <div v-if="loading" class="map-loading">
      <el-icon class="spinning"><Loading /></el-icon>
      <span>{{ loadingMsg }}</span>
    </div>
    <DrawToolbar @select-tool="onSelectTool" @clear="onClearTools" />
    <HeatmapControls
      :visible="heatmapControlsVisible"
      :blur="heatBlur"
      :radius="heatRadius"
      @update-blur="updateHeatBlur"
      @update-radius="updateHeatRadius"
    />

    <FeaturePopup :feature="clickedFeature" @close="clickedFeature = null" />
    <MapLegend :visible="legendVisible" @close="legendVisible = false" />
    <MapControls
      :overview-visible="overviewVisible"
      @toggle-overview="toggleOverview"
      @zoom-kenya="zoomToKenya"
      @toggle-legend="legendVisible = !legendVisible"
    />

    <PrintExport :map-instance="map" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import HeatmapLayer from 'ol/layer/Heatmap'
import GeoJSON from 'ol/format/GeoJSON'
import { fromLonLat, transformExtent, toLonLat } from 'ol/proj'
import { Style, Stroke, Circle, Fill, RegularShape } from 'ol/style'
import { Loading } from '@element-plus/icons-vue'
import { useMapControls } from '../composables/useMapControls.js'
import { BASEMAPS } from '../composables/useBasemaps.js'
import { useFaultSimulation } from '../composables/useFaultSimulation'
import { useMeasureDraw } from '../composables/useMeasureDraw.js'
import FeaturePopup from './FeaturePopup.vue'
import MapControls from './MapControls.vue'
import DrawToolbar from './DrawToolbar.vue'
import HeatmapControls from './HeatmapControls.vue'
import { WMS_LAYERS, WMTS_LAYERS, createWMSLayer, createWMTSLayer } from '../composables/useWMS.js'
import MapLegend from './MapLegend.vue'
import PrintExport from './PrintExport.vue'

const props = defineProps({ flyToBbox: Array })
const emit = defineEmits(['layers-ready', 'feature-count', 'view-change'])
const legendVisible = ref(true)
// ── Reactive state ────────────────────────────────────────────────────────────
const mapEl = ref(null)
const loading = ref(false)
const loadingMsg = ref('Loading power grid data…')
const clickedFeature = ref(null)
const faultMode = ref(false)
const overviewVisible = ref(true)
const heatBlur = ref(15)
const heatRadius = ref(8)
const heatmapControlsVisible = ref(false)
const gridStats = ref({
  line_220: 0,
  line_132: 0,
  line_66: 0,
  line_33: 0,
  line_11: 0,
  tx_station: 0,
  px_station: 0,
  transformer: 0,
  totalLengthKm: 0,
})

// ── Non-reactive module-scope variables ───────────────────────────────────────
let map = null
let heatmapLayer = null
let currentBaseLayer = null
const olLayerMap = {}

const wmsPanelRef = ref(null)
const wmsLayerMap = {}
// ── Module-scope placeholder functions (assigned in onMounted) ────────────────
let onSelectTool = () => {}
let onClearTools = () => {}
let triggerFault = () => {}
let resolveFault = () => {}
let resolveAllFaults = () => {}

// ── FIX 1: linkHeatmapSource at module scope (was nested inside updateGridStats) ─
function linkHeatmapSource() {
  const transformerLayer = olLayerMap['transformer']
  if (transformerLayer && heatmapLayer) {
    const src = transformerLayer.getSource()
    if (src.getFeatures().length > 0) {
      heatmapLayer.setSource(src)
      console.log('[heatmap] Source linked:', src.getFeatures().length, 'points')
    }
  }
}

// ── updateGridStats at module scope ───────────────────────────────────────────
function updateGridStats() {
  const counts = {}
  let totalLength = 0

  for (const [layerId, olLayer] of Object.entries(olLayerMap)) {
    // Skip the heatmap layer — it shares the transformer source, don't double-count
    if (layerId === 'transformer_heat') continue
    const features = olLayer.getSource().getFeatures()
    counts[layerId] = features.length

    if (layerId.startsWith('line_')) {
      for (const f of features) {
        const geom = f.getGeometry()
        if (geom?.getLength) {
          totalLength += geom.getLength() / 1000
        }
      }
    }
  }

  gridStats.value = { ...counts, totalLengthKm: Math.round(totalLength) }
  console.log('[updateGridStats] Stats computed:', gridStats.value)
}

// ── Heatmap controls ──────────────────────────────────────────────────────────
function updateHeatBlur(val) {
  heatBlur.value = val
  heatmapLayer?.setBlur(val)
}

function updateHeatRadius(val) {
  heatRadius.value = val
  heatmapLayer?.setRadius(val)
}

// ── Map controls ──────────────────────────────────────────────────────────────
function zoomToKenya() {
  if (!map) return
  map.getView().animate({
    center: fromLonLat([37.9062, 0.0236]),
    zoom: 6.5,
    duration: 800,
  })
}

function setFaultMode(val) {
  faultMode.value = val
}

function callResolveFault(faultId) {
  resolveFault(faultId)
}

function callResolveAllFaults() {
  console.log('[MapView] callResolveFault called, resolveFault type:', typeof resolveFault)
  resolveAllFaults()
}

function toggleLegend() {
  legendVisible.value = !legendVisible.value
}

function toggleWMSLayer(layerId, visible) {
  const layer = wmsLayerMap[layerId]
  if (layer) {
    layer.setVisible(visible)
    console.log(`[WMS] ${layerId} → ${visible}`)
  }
}

function setWMSOpacity(opacity) {
  for (const layer of Object.values(wmsLayerMap)) {
    layer.setOpacity(opacity)
  }
}

function toggleOverview() {
  overviewVisible.value = !overviewVisible.value
  const el = document.querySelector('.ol-overviewmap')
  if (el) el.style.display = overviewVisible.value ? '' : 'none'
}
function getLayerFeatures(layerId) {
  return olLayerMap[layerId]?.getSource()?.getFeatures() ?? []
}

function syncView(lon, lat, zoom) {
  if (!map) return
  map.getView().animate({
    center: fromLonLat([lon, lat]),
    zoom: zoom ?? map.getView().getZoom(),
    duration: 300,
  })
}

// ── Basemap switcher ──────────────────────────────────────────────────────────
function switchBasemap(basemapId) {
  if (!map || !currentBaseLayer) {
    console.warn('[switchBasemap] Map not ready yet')
    return
  }
  const def = BASEMAPS.find((b) => b.id === basemapId)
  if (!def) {
    console.warn('[switchBasemap] Unknown basemap:', basemapId)
    return
  }
  console.log('[switchBasemap] Switching to:', basemapId)
  map.removeLayer(currentBaseLayer)
  const newBaseLayer = new TileLayer({
    source: def.makeSource(),
    properties: { isBasemap: true },
  })
  map.getLayers().insertAt(0, newBaseLayer)
  currentBaseLayer = newBaseLayer
  console.log('[switchBasemap] Done. Total layers:', map.getLayers().getLength())
}

// ── Layer groups ──────────────────────────────────────────────────────────────
const layerGroups = [
  {
    id: 'transmission',
    label: 'Transmission lines',
    color: '#dc2626',
    open: true,
    layers: [
      { id: 'line_220', label: '220 kV lines', color: '#dc2626', shape: 'line', visible: true },
      { id: 'line_132', label: '132 kV lines', color: '#ea580c', shape: 'line', visible: true },
    ],
  },
  {
    id: 'distribution',
    label: 'Distribution network',
    color: '#2563eb',
    open: true,
    layers: [
      { id: 'line_66', label: '66 kV lines', color: '#2563eb', shape: 'line', visible: true },
      { id: 'line_33', label: '33 kV lines', color: '#7c3aed', shape: 'line', visible: true },
      { id: 'line_11', label: '11 kV lines', color: '#0891b2', shape: 'line', visible: false },
    ],
  },
  {
    id: 'stations',
    label: 'Stations',
    color: '#1a6b3c',
    open: true,
    layers: [
      {
        id: 'tx_station',
        label: 'Transmission stations',
        color: '#1a6b3c',
        shape: 'square',
        visible: true,
      },
      {
        id: 'px_station',
        label: 'Primary substations',
        color: '#059669',
        shape: 'square',
        visible: true,
      },
    ],
  },
  {
    id: 'transformers',
    label: 'Transformers',
    color: '#b45309',
    open: false,
    layers: [
      {
        id: 'transformer',
        label: 'Distribution transformers',
        color: '#b45309',
        shape: 'dot',
        visible: false,
      },
    ],
  },
  {
    id: 'heatmap',
    label: 'Heatmap',
    color: '#ef4444',
    open: false,
    layers: [
      {
        id: 'transformer_heat',
        label: 'Transformer density',
        color: '#ef4444',
        shape: 'dot',
        visible: false,
      },
    ],
  },
]

// ── GeoServer WFS ─────────────────────────────────────────────────────────────
const GEOSERVER_URL = 'http://localhost:8085/geoserver/kplc/ows'

const DATA_SOURCES = {
  line_220: 'lines_220kv',
  line_132: 'lines_132kv',
  line_66: 'lines_66kv',
  line_33: 'lines_33kv',
  line_11: 'lines_11kv',
  tx_station: 'transmission_stations',
  px_station: 'primary_substations',
  transformer: 'transformers',
}

function wfsUrl(layerName) {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: `kplc:${layerName}`,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
  })
  return `${GEOSERVER_URL}?${params.toString()}`
}

function wfsBboxUrl(layerName, bbox) {
  const [w, s, e, n] = bbox
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: `kplc:${layerName}`,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    bbox: `${s},${w},${n},${e},EPSG:4326`,
  })
  return `${GEOSERVER_URL}?${params.toString()}`
}

// ── Styles ────────────────────────────────────────────────────────────────────
const LAYER_STYLES = {
  line_220: new Style({ stroke: new Stroke({ color: '#dc2626', width: 3 }) }),
  line_132: new Style({ stroke: new Stroke({ color: '#ea580c', width: 2.5 }) }),
  line_66: new Style({ stroke: new Stroke({ color: '#2563eb', width: 2 }) }),
  line_33: new Style({ stroke: new Stroke({ color: '#7c3aed', width: 1.5 }) }),
  line_11: new Style({ stroke: new Stroke({ color: '#0891b2', width: 1 }) }),
  tx_station: new Style({
    image: new RegularShape({
      points: 4,
      radius: 10,
      angle: Math.PI / 4,
      fill: new Fill({ color: '#1a6b3c' }),
      stroke: new Stroke({ color: '#fff', width: 1.5 }),
    }),
  }),
  px_station: new Style({
    image: new RegularShape({
      points: 4,
      radius: 7,
      angle: Math.PI / 4,
      fill: new Fill({ color: '#059669' }),
      stroke: new Stroke({ color: '#fff', width: 1.5 }),
    }),
  }),
  transformer: new Style({
    image: new Circle({
      radius: 4,
      fill: new Fill({ color: '#b45309' }),
      stroke: new Stroke({ color: '#fff', width: 1 }),
    }),
  }),
  // transformer_heat has no VectorLayer style — it uses HeatmapLayer
}

// ── GeoJSON parsing ───────────────────────────────────────────────────────────
function readFeatures(geojson) {
  const format = new GeoJSON({ dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' })
  return format.readFeatures(geojson)
}

async function loadLayer(layerId) {
  const url = wfsUrl(DATA_SOURCES[layerId])
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`WFS ${res.status} for ${layerId}: ${text.slice(0, 120)}`)
  }
  const geojson = await res.json()
  const features = readFeatures(geojson)
  if (features.length === 0) console.warn(`[${layerId}] WFS returned 0 features`)
  else console.log(`[${layerId}] ✓ ${features.length} features`)
  features.forEach((f) => f.set('_layerId', layerId))
  return features
}

async function loadLayerInBbox(layerId, bbox) {
  const url = wfsBboxUrl(DATA_SOURCES[layerId], bbox)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`WFS bbox error ${res.status} for ${layerId}`)
  const geojson = await res.json()
  const features = readFeatures(geojson)
  features.forEach((f) => f.set('_layerId', layerId))
  console.log(`[${layerId}] bbox reload: ${features.length} features`)
  return features
}

// ── Lazy layers ───────────────────────────────────────────────────────────────
const LAZY_LAYERS = new Set(['line_11', 'transformer'])
const lazyLoaded = new Set()

async function ensureLazyLayer(layerId) {
  if (!LAZY_LAYERS.has(layerId)) return

  // FIX: check if OL source actually has features — not just if we tried loading
  const existingFeatures = olLayerMap[layerId]?.getSource()?.getFeatures()?.length ?? 0
  if (lazyLoaded.has(layerId) && existingFeatures > 0) return // already loaded and has data

  // If marked as loaded but source is empty — reload
  lazyLoaded.add(layerId)
  loadingMsg.value =
    layerId === 'line_11'
      ? 'Loading 11 kV lines from GeoServer…'
      : 'Loading distribution transformers from GeoServer…'
  loading.value = true
  try {
    const features = await loadLayer(layerId)
    olLayerMap[layerId].getSource().clear()
    olLayerMap[layerId].getSource().addFeatures(features)
    if (layerId === 'transformer') linkHeatmapSource()
    updateGridStats()
  } catch (err) {
    console.error(`[${layerId}] Lazy load failed:`, err.message)
    lazyLoaded.delete(layerId)
  } finally {
    loading.value = false
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await nextTick()

  // 1. Base layer
  const baseLayer = new TileLayer({
    source: new OSM(),
    properties: { isBasemap: true },
  })
  currentBaseLayer = baseLayer

  console.log('Container size:', mapEl.value?.offsetWidth, 'x', mapEl.value?.offsetHeight)

  map = new Map({
    target: mapEl.value,
    layers: [baseLayer],
    view: new View({
      center: fromLonLat([37.9062, 0.0236]),
      zoom: 6.5,
    }),
  })

  // Create WMS layers and add to map (all invisible initially)
  for (const layerDef of WMS_LAYERS) {
    const wmsLayer = createWMSLayer(layerDef)
    wmsLayerMap[layerDef.id] = wmsLayer
    map.addLayer(wmsLayer)
  }

  for (const layerDef of WMTS_LAYERS) {
    try {
      const wmtsLayer = createWMTSLayer(layerDef)
      wmsLayerMap[layerDef.id] = wmtsLayer
      map.addLayer(wmtsLayer)
      console.log(`[WMTS] Layer created: ${layerDef.id}`)
    } catch (err) {
      console.warn(`[WMTS] Failed to create ${layerDef.id}:`, err.message)
    }
  }

  // 2. Map controls
  const controls = useMapControls(map)
  controls.addScaleLine()
  controls.addMousePosition('mouse-position-display')
  controls.addOverviewMap()

  // 3. Fault simulation
  const faultSim = useFaultSimulation(map, olLayerMap)
  triggerFault = faultSim.triggerFault
  resolveFault = faultSim.resolveFault
  resolveAllFaults = faultSim.resolveAllFaults
  faultSim.initFaultLayers()
  console.log('resolveFault assigned:', typeof resolveFault, resolveFault.toString().slice(0, 50))

  // 4. Heatmap layer (empty source — linked to transformer data later)
  heatmapLayer = new HeatmapLayer({
    source: new VectorSource(),
    blur: heatBlur.value,
    radius: heatRadius.value,
    weight: () => 1,
    visible: false,
    zIndex: 994,
    properties: { layerId: 'transformer_heat' },
  })
  map.addLayer(heatmapLayer)
  olLayerMap['transformer_heat'] = heatmapLayer

  // 5. Measure/draw tools
  const measureDraw = useMeasureDraw(map)
  measureDraw.addLayers()

  onSelectTool = (tool) => {
    measureDraw.stopActiveInteraction()
    if (tool === 'measure-distance') measureDraw.startMeasureDistance()
    else if (tool === 'measure-area') measureDraw.startMeasureArea()
    else if (tool === 'draw-point') measureDraw.startDraw('Point')
    else if (tool === 'draw-line') measureDraw.startDraw('LineString')
    else if (tool === 'draw-polygon') measureDraw.startDraw('Polygon')
  }
  onClearTools = () => measureDraw.clearAll()

  // 6. Click handler
  map.on('click', (evt) => {
    const hits = []
    map.forEachFeatureAtPixel(evt.pixel, (f) => hits.push(f))
    const feature = hits[0] ?? null
    if (faultMode.value && feature && feature.get('_layerId')) {
      triggerFault(feature)
      clickedFeature.value = null
    } else {
      clickedFeature.value = feature
    }
  })
  map.on('moveend', () => {
    const view = map.getView()
    const center = toLonLat(view.getCenter())
    emit('view-change', {
      lon: center[0],
      lat: center[1],
      zoom: view.getZoom(),
    })
  })

  // 7. Create OL vector layers (skip heatmap — already added above)
  for (const group of layerGroups) {
    for (const layerDef of group.layers) {
      if (layerDef.id === 'transformer_heat') continue // already created as HeatmapLayer
      const olLayer = new VectorLayer({
        source: new VectorSource(),
        visible: layerDef.visible,
        style: LAYER_STYLES[layerDef.id],
        properties: { layerId: layerDef.id },
      })
      olLayerMap[layerDef.id] = olLayer
      map.addLayer(olLayer)
    }
  }

  // 8. Tell sidebar which groups exist
  emit('layers-ready', layerGroups)

  // 9. Load eager layers in parallel
  loading.value = true
  loadingMsg.value = 'Loading power grid data from GeoServer…'
  const eagerIds = Object.keys(DATA_SOURCES).filter((id) => !LAZY_LAYERS.has(id))
  let total = 0
  const results = await Promise.allSettled(
    eagerIds.map(async (id) => {
      const features = await loadLayer(id)
      olLayerMap[id].getSource().addFeatures(features)
      total += features.length
    }),
  )
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`[${eagerIds[i]}] Failed:`, r.reason.message)
  })
  emit('feature-count', total)
  loading.value = false
  updateGridStats()
  console.log(`All eager layers loaded. Total features: ${total}`)
})

// ── County fly-to ─────────────────────────────────────────────────────────────
const BBOX_RELOAD_LAYERS = ['line_33', 'line_11', 'transformer']

watch(
  () => props.flyToBbox,
  async (bbox) => {
    if (!bbox || !map) return
    const extent3857 = transformExtent(bbox, 'EPSG:4326', 'EPSG:3857')
    map.getView().fit(extent3857, { padding: [60, 60, 60, 320], duration: 800 })
    loading.value = true
    loadingMsg.value = 'Loading county data from GeoServer…'
    await Promise.allSettled(
      BBOX_RELOAD_LAYERS.map(async (layerId) => {
        if (!olLayerMap[layerId]?.getVisible()) return
        try {
          const features = await loadLayerInBbox(layerId, bbox)
          const src = olLayerMap[layerId].getSource()
          src.clear()
          src.addFeatures(features)
        } catch (err) {
          console.warn(`[${layerId}] bbox reload failed:`, err.message)
        }
      }),
    )
    loading.value = false
  },
)

// ── Layer visibility ──────────────────────────────────────────────────────────
async function setLayerVisible(layerId, visible) {
  if (layerId === 'transformer_heat') {
    // FIX 2: show/hide heatmap controls when heatmap is toggled
    heatmapControlsVisible.value = visible
    if (visible) {
      await ensureLazyLayer('transformer')
      linkHeatmapSource()
    }
  } else {
    await ensureLazyLayer(layerId)
  }
  olLayerMap[layerId]?.setVisible(visible)
}

// ── Exposed to App.vue ────────────────────────────────────────────────────────
defineExpose({
  setLayerVisible,
  faultMode,
  resolveFault: callResolveFault, // ← permanent wrapper
  resolveAllFaults: callResolveAllFaults,
  resolveFault,
  resolveAllFaults,
  switchBasemap,
  zoomToKenya,
  gridStats,
  getLayerFeatures,
  syncView,
  setFaultMode,
  toggleWMSLayer, // ← add
  setWMSOpacity,
  toggleLegend,
})
</script>

<style scoped>
.map-wrap {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}
.map-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 32px;
}
.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 14px 22px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #374151;
  z-index: 200;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
