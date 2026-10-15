<template>
  <div class="app">
    <Sidebar
      :layer-groups="layerGroups"
      :feature-count="featureCount"
      :fault-mode="faultMode"
      :split-screen="splitScreen"
      @fly-to-county="onFlyToCounty"
      @toggle-layer="onToggleLayer"
      @toggle-fault-mode="onToggleFaultMode"
      @switch-basemap="onSwitchBasemap"
      @toggle-stats="showStatsPanel = !showStatsPanel"
      @toggle-split="onToggleSplit"
      @toggle-wms-panel="onToggleWMSPanel"
      @toggle-legend="onToggleLegend"
    />

    <div class="map-area">
      <!-- 2D label -->
      <div v-if="splitScreen" class="map-label">2D View</div>

      <MapView
        ref="mapViewRef"
        class="map-pane"
        :fly-to-bbox="flyToBbox"
        @layers-ready="onLayersReady"
        @feature-count="featureCount = $event"
        @view-change="onOlViewChange"
      />
      <WMSPanel
        ref="wmsPanelRef"
        :show="showWMSPanel"
        @close="showWMSPanel = false"
        @toggle-wms="onToggleWMS"
        @opacity-change="onWMSOpacityChange"
      />

      <!-- Vertical divider -->
      <div v-if="splitScreen" class="split-divider"></div>

      <!-- 3D Cesium view -->
      <CesiumView
        v-if="splitScreen"
        ref="cesiumViewRef"
        class="map-pane"
        :sync-center="cesiumSyncCenter"
        @view-change="onCesiumViewChange"
      />
    </div>

    <FaultPanel
      :show="showFaultPanel"
      @close="showFaultPanel = false"
      @resolve-fault="onResolveFault"
      @resolve-all="onResolveAll"
    />

    <StatsPanel :show="showStatsPanel" :stats="gridStatsForPanel" @close="showStatsPanel = false" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import Sidebar from './components/Sidebar.vue'
import MapView from './components/MapView.vue'
import FaultPanel from './components/FaultPanel.vue'
import StatsPanel from './components/StatsPanel.vue'
import CesiumView from './components/CesiumView.vue'
import WMSPanel from './components/WMSPanel.vue'
const mapViewRef = ref(null)
const cesiumViewRef = ref(null)
const layerGroups = ref([])
const featureCount = ref(0)
const flyToBbox = ref(null)
const faultMode = ref(false)
const showFaultPanel = ref(false)
const showStatsPanel = ref(false)
const splitScreen = ref(false)
const cesiumSyncCenter = ref(null)

const gridStatsForPanel = computed(() => mapViewRef.value?.gridStats || {})

const showWMSPanel = ref(false)

function onToggleWMSPanel() {
  showWMSPanel.value = !showWMSPanel.value
}
const wmsPanelRef = ref(null)

function onToggleWMS({ layerId, visible }) {
  mapViewRef.value?.toggleWMSLayer(layerId, visible)
  wmsPanelRef.value?.setVisible(layerId, visible)
}

function onToggleLegend() {
  mapViewRef.value?.toggleLegend()
}

function onWMSOpacityChange(opacity) {
  mapViewRef.value?.setWMSOpacity(opacity)
}

function onLayersReady(groups) {
  layerGroups.value = groups
}

function onFlyToCounty(bbox) {
  flyToBbox.value = null
  nextTick(() => {
    flyToBbox.value = bbox
  })
}

async function onToggleLayer({ layerId, visible }) {
  for (const group of layerGroups.value) {
    const layerDef = group.layers.find((l) => l.id === layerId)
    if (layerDef) {
      layerDef.visible = visible
      break
    }
  }
  await mapViewRef.value?.setLayerVisible(layerId, visible)
  //mapViewRef.value?.setLayerVisible(layerId, visible)

  if (splitScreen.value) {
    // Extra wait for lazy layers (WFS fetch takes time)
    if (['line_11', 'transformer'].includes(layerId) && visible) {
      await new Promise((r) => setTimeout(r, 4000))
    }
    loadLayersIntoCesium()
  }
}
/*function onToggleWMSPanel() {
  if (mapViewRef.value) mapViewRef.value.showWMSPanel.value = !mapViewRef.value.showWMSPanel.value
}*/

function onToggleFaultMode() {
  faultMode.value = !faultMode.value
  if (faultMode.value) showFaultPanel.value = true
  mapViewRef.value?.setFaultMode(faultMode.value)
}
function onResolveFault(faultId) {
  console.log('[App] resolveFault called with:', faultId)
  console.log('[App] mapViewRef.value:', !!mapViewRef.value)
  mapViewRef.value?.resolveFault(faultId)
}

function onResolveAll() {
  console.log('[App] resolveAll called')
  mapViewRef.value?.resolveAllFaults()
}
function onSwitchBasemap(basemapId) {
  mapViewRef.value?.switchBasemap(basemapId)
}

// ── Split screen ──────────────────────────────────────────────────────────────
async function onToggleSplit() {
  splitScreen.value = !splitScreen.value
  console.log('[Split] layerGroups at toggle time:', layerGroups.value?.length)

  if (splitScreen.value) {
    // Give CesiumView time to mount, then load current layers into it
    await nextTick()
    await new Promise((r) => setTimeout(r, 800))
    loadLayersIntoCesium()
  }
}

function loadLayersIntoCesium() {
  if (!cesiumViewRef.value) return
  cesiumViewRef.value.clearEntities()

  const lineVoltages = {
    line_220: 220,
    line_132: 132,
    line_66: 66,
    line_33: 33,
    line_11: 11,
  }
  const pointTypes = ['tx_station', 'px_station', 'transformer']

  for (const group of layerGroups.value) {
    for (const layerDef of group.layers) {
      if (!layerDef.visible) continue
      if (layerDef.id === 'transformer_heat') continue

      const features = mapViewRef.value?.getLayerFeatures(layerDef.id) ?? []
      if (!features.length) continue

      console.log(`[Cesium] Loading ${layerDef.id}: ${features.length} features`)

      if (lineVoltages[layerDef.id] !== undefined) {
        cesiumViewRef.value.loadLines(features, lineVoltages[layerDef.id])
      } else if (pointTypes.includes(layerDef.id)) {
        cesiumViewRef.value.loadPoints(features, layerDef.id)
        // Add labels for stations
        cesiumViewRef.value.loadStationLabels(features, layerDef.id)
      }
    }
  }

  setTimeout(() => cesiumViewRef.value?.flyToKenya(), 300)
}

// ── View synchronization ──────────────────────────────────────────────────────
function onOlViewChange(center) {
  if (!splitScreen.value) return
  cesiumSyncCenter.value = center
}

function onCesiumViewChange({ lon, lat, zoom }) {
  if (!splitScreen.value) return
  mapViewRef.value?.syncView(lon, lat, zoom)
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html,
body,
#app {
  height: 100%;
  overflow: hidden;
}
.app {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.map-area {
  flex: 1;
  display: flex;
  flex-direction: row;
  position: relative;
  overflow: hidden;
  min-width: 0;
}
.map-pane {
  flex: 1;
  min-width: 0;
  height: 100%;
}
.map-label {
  position: absolute;
  top: 10px;
  left: calc(50% - 60px);
  z-index: 500;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 4px;
  pointer-events: none;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.split-divider {
  width: 4px;
  background: #1a6b3c;
  flex-shrink: 0;
  cursor: col-resize;
}
</style>
