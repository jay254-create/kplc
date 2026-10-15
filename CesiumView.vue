<template>
  <div class="cesium-wrap">
    <div ref="cesiumEl" class="cesium-container"></div>
    <div class="cesium-label">3D View</div>

    <!-- Legend -->
    <div class="cesium-legend">
      <div class="legend-title">Power Grid</div>
      <div class="legend-row">
        <span class="legend-line" style="background: #ff4444"></span>220 kV
      </div>
      <div class="legend-row">
        <span class="legend-line" style="background: #ff8c00"></span>132 kV
      </div>
      <div class="legend-row">
        <span class="legend-line" style="background: #4488ff"></span>66 kV
      </div>
      <div class="legend-row">
        <span class="legend-line" style="background: #aa44ff"></span>33 kV
      </div>
      <div class="legend-row">
        <span class="legend-line" style="background: #00ccff"></span>11 kV
      </div>
      <div class="legend-row">
        <span class="legend-dot" style="background: #1a6b3c"></span>Tx Station
      </div>
      <div class="legend-row">
        <span class="legend-dot" style="background: #059669"></span>Primary Sub
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { toLonLat } from 'ol/proj'
import {
  Viewer,
  Cartesian3,
  Cartesian2,
  Math as CesiumMath,
  Color,
  createWorldTerrainAsync,
  PolylineGlowMaterialProperty,
  HeightReference,
  VerticalOrigin,
  HorizontalOrigin,
  LabelStyle,
  Cartesian3 as C3,
  NearFarScalar,
  DistanceDisplayCondition,
} from 'cesium'

const props = defineProps({ syncCenter: Object })
const emit = defineEmits(['view-change'])

const cesiumEl = ref(null)
let viewer = null
let isSyncing = false

// ── Voltage config ────────────────────────────────────────────────────────────
const VOLTAGE_CONFIG = {
  220: { color: '#ff4444', glowColor: '#ff0000', width: 6, glowWidth: 12, height: 15000 },
  132: { color: '#ff8c00', glowColor: '#ff6600', width: 5, glowWidth: 10, height: 11000 },
  66: { color: '#4488ff', glowColor: '#2266ff', width: 4, glowWidth: 8, height: 7000 },
  33: { color: '#aa44ff', glowColor: '#8822ff', width: 2.5, glowWidth: 5, height: 3500 },
  11: { color: '#00ccff', glowColor: '#0099cc', width: 1.5, glowWidth: 3, height: 1500 },
}

const POINT_CONFIG = {
  tx_station: { color: '#1a6b3c', size: 16, height: 10000, labelColor: '#ffffff' },
  px_station: { color: '#059669', size: 12, height: 6000, labelColor: '#ffffff' },
  transformer: { color: '#b45309', size: 6, height: 1000, labelColor: '#ffffcc' },
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  viewer = new Viewer(cesiumEl.value, {
    terrainProvider: await createWorldTerrainAsync(),
    baseLayerPicker: false,
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    homeButton: false,
    sceneModePicker: true,
    geocoder: false,
    infoBox: false,
    selectionIndicator: false,
  })

  // ── Atmosphere and lighting for realism ───────────────────────────────────
  viewer.scene.globe.enableLighting = true
  viewer.scene.atmosphere.show = true
  viewer.scene.fog.enabled = true
  viewer.scene.fog.density = 0.0002
  viewer.scene.skyAtmosphere.show = true

  // Smooth terrain rendering
  viewer.scene.globe.maximumScreenSpaceError = 2

  // Initial view — Kenya from dramatic angle
  viewer.camera.setView({
    destination: Cartesian3.fromDegrees(37.9062, 0.0236, 900000),
    orientation: {
      heading: CesiumMath.toRadians(0),
      pitch: CesiumMath.toRadians(-45),
      roll: 0,
    },
  })

  // Sync Cesium → OL
  viewer.camera.changed.addEventListener(() => {
    if (isSyncing) return
    const pos = viewer.camera.positionCartographic
    emit('view-change', {
      lon: CesiumMath.toDegrees(pos.longitude),
      lat: CesiumMath.toDegrees(pos.latitude),
      zoom: Math.max(1, 20 - Math.log2(pos.height / 1000)),
    })
  })
})

// Sync OL → Cesium
watch(
  () => props.syncCenter,
  (center) => {
    if (!viewer || !center || isSyncing) return
    isSyncing = true
    const height = Math.pow(2, 20 - (center.zoom || 6)) * 1000
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(center.lon, center.lat, height),
      duration: 0.8,
      complete: () => {
        isSyncing = false
      },
    })
  },
  { deep: true },
)

// ── Load power lines with glow effect ────────────────────────────────────────
function loadLines(features, voltageKv) {
  if (!viewer || !features?.length) return

  const config = VOLTAGE_CONFIG[voltageKv] ?? {
    color: '#888888',
    glowColor: '#666666',
    width: 2,
    glowWidth: 4,
    height: 1000,
  }

  const lineColor = Color.fromCssColorString(config.color)
  const glowColor = Color.fromCssColorString(config.glowColor).withAlpha(0.4)

  for (const f of features) {
    const geom = f.getGeometry()
    if (!geom) continue

    const type = geom.getType()
    let segments = []
    if (type === 'LineString') segments = [geom.getCoordinates()]
    else if (type === 'MultiLineString') segments = geom.getCoordinates()
    else continue

    for (const segment of segments) {
      if (!segment || segment.length < 2) continue

      const positions = []
      for (const coord of segment) {
        if (!coord || coord[0] === undefined || coord[1] === undefined) continue
        try {
          const [lon, lat] = toLonLat([coord[0], coord[1]])
          if (isNaN(lon) || isNaN(lat)) continue
          if (lon < 33 || lon > 42 || lat < -5 || lat > 5) continue // Kenya bounds
          positions.push(Cartesian3.fromDegrees(lon, lat, config.height))
        } catch (e) {
          continue
        }
      }

      if (positions.length < 2) continue

      // Main line
      viewer.entities.add({
        polyline: {
          positions,
          width: config.width,
          material: new PolylineGlowMaterialProperty({
            glowPower: 0.2,
            taperPower: 1.0,
            color: lineColor,
          }),
          clampToGround: false,
        },
      })

      // Glow halo (outer glow for high voltage lines)
      if (voltageKv >= 66) {
        viewer.entities.add({
          polyline: {
            positions,
            width: config.glowWidth,
            material: new PolylineGlowMaterialProperty({
              glowPower: 0.4,
              color: glowColor,
            }),
            clampToGround: false,
          },
        })
      }
    }
  }
}

// ── Load stations as 3D cylinders with labels ─────────────────────────────────
function loadPoints(features, type) {
  if (!viewer || !features?.length) return

  const config = POINT_CONFIG[type] ?? {
    color: '#ffffff',
    size: 8,
    height: 2000,
    labelColor: '#ffffff',
  }

  const pointColor = Color.fromCssColorString(config.color)
  const labelColor = Color.fromCssColorString(config.labelColor)

  const typeLabels = {
    tx_station: 'TX',
    px_station: 'PS',
    transformer: 'TR',
  }

  for (const f of features) {
    const geom = f.getGeometry()
    if (!geom) continue

    const rawCoords = geom.getCoordinates()
    if (!rawCoords || rawCoords[0] === undefined) continue

    try {
      const [lon, lat] = toLonLat([rawCoords[0], rawCoords[1]])
      if (isNaN(lon) || isNaN(lat)) continue
      if (lon < 33 || lon > 42 || lat < -5 || lat > 5) continue

      const position = Cartesian3.fromDegrees(lon, lat, config.height)

      // Point marker
      viewer.entities.add({
        position,
        point: {
          pixelSize: config.size,
          color: pointColor,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          scaleByDistance: new NearFarScalar(1e4, 2.0, 1e7, 0.5),
          distanceDisplayCondition: new DistanceDisplayCondition(0, 2e6),
        },
      })

      // Label — only show for stations (not transformers — too many)
      if (type !== 'transformer') {
        const name = f.get('Name_IMS11') || f.get('Name8') || f.get('name_ims11') || ''
        viewer.entities.add({
          position,
          label: {
            text: name || typeLabels[type],
            font: 'bold 12px sans-serif',
            fillColor: labelColor,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: VerticalOrigin.BOTTOM,
            horizontalOrigin: HorizontalOrigin.CENTER,
            pixelOffset: new Cartesian2(0, -config.size - 4),
            scaleByDistance: new NearFarScalar(1e4, 1.5, 5e5, 0.5),
            distanceDisplayCondition: new DistanceDisplayCondition(0, 8e5),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        })
      }
    } catch (e) {
      continue
    }
  }
}

// ── Fly to Kenya ──────────────────────────────────────────────────────────────
function flyToKenya() {
  if (!viewer) return
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(37.9062, 0.0236, 800000),
    duration: 1.5,
    orientation: {
      heading: CesiumMath.toRadians(0),
      pitch: CesiumMath.toRadians(-45),
      roll: 0,
    },
  })
}

// ── Clear entities ────────────────────────────────────────────────────────────
function clearEntities() {
  viewer?.entities.removeAll()
}

onUnmounted(() => {
  viewer?.destroy()
  viewer = null
})

defineExpose({ loadLines, loadPoints, clearEntities, flyToKenya })
</script>

<style scoped>
.cesium-wrap {
  flex: 1;
  position: relative;
  min-width: 0;
  overflow: hidden;
}
.cesium-container {
  width: 100%;
  height: 100%;
}
.cesium-label {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 4px;
  pointer-events: none;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  z-index: 10;
}
.cesium-legend {
  position: absolute;
  bottom: 40px;
  left: 12px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  border-radius: 8px;
  padding: 10px 12px;
  z-index: 10;
  min-width: 120px;
}
.legend-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 7px;
  color: #ccc;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  margin-bottom: 4px;
  color: #eee;
}
.legend-line {
  display: inline-block;
  width: 22px;
  height: 3px;
  border-radius: 2px;
  flex-shrink: 0;
}
.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid #fff;
  flex-shrink: 0;
}
/* Hide Cesium ion credit warning */
:global(.cesium-credit-logoContainer) {
  display: none !important;
}
:global(.cesium-credit-textContainer) {
  display: none !important;
}
</style>
