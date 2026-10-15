<template>
  <div class="controls-bar">
    <div class="coord-box">
      <span class="coord-label">Coordinates</span>
      <div id="mouse-position-display" class="coord-value"></div>
    </div>
    <div class="control-btns">
      <el-tooltip content="Toggle legend" placement="top">
        <button class="ctrl-btn" @click="$emit('toggle-legend')">🗺</button>
      </el-tooltip>
      <el-tooltip content="Export map as PNG" placement="top">
        <button class="ctrl-btn" :class="{ active: exporting }" @click="exportMap">
          <span v-if="!exporting">🖨</span>
          <el-icon v-else class="spinning"><Loading /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip content="Toggle overview map" placement="top">
        <button
          class="ctrl-btn"
          :class="{ active: overviewVisible }"
          @click="$emit('toggle-overview')"
        >
          <el-icon><MapLocation /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip content="Zoom to Kenya" placement="top">
        <button class="ctrl-btn" @click="$emit('zoom-kenya')">
          <el-icon><Aim /></el-icon>
        </button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MapLocation, Aim, Loading } from '@element-plus/icons-vue'

const props = defineProps({ overviewVisible: Boolean, mapInstance: Object })
defineEmits(['toggle-overview', 'zoom-kenya', 'toggle-legend'])

const exporting = ref(false)

function exportMap() {
  if (!props.mapInstance || exporting.value) return
  exporting.value = true

  props.mapInstance.once('rendercomplete', () => {
    const mapCanvas = document.createElement('canvas')
    const size = props.mapInstance.getSize()
    mapCanvas.width = size[0]
    mapCanvas.height = size[1]
    const ctx = mapCanvas.getContext('2d')

    document.querySelectorAll('.map-container canvas').forEach((canvas) => {
      if (canvas.width > 0) ctx.drawImage(canvas, 0, 0)
    })

    const link = document.createElement('a')
    link.download = `kplc-grid-${new Date().toISOString().slice(0, 10)}.png`
    link.href = mapCanvas.toDataURL('image/png')
    link.click()
    exporting.value = false
  })

  props.mapInstance.renderSync()
}
</script>

<style scoped>
.controls-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 32px;
  background: rgba(252, 250, 253, 0.92);
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  z-index: 100;
}
.coord-box {
  display: flex;
  align-items: center;
  gap: 8px;
}
.coord-label {
  font-size: 10px;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
}
.coord-value {
  font-size: 11px;
  color: #374151;
  font-family: monospace;
  min-width: 200px;
}
.control-btns {
  display: flex;
  gap: 4px;
}
.ctrl-btn {
  width: 26px;
  height: 26px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 13px;
  transition: all 0.12s;
}
.ctrl-btn:hover {
  background: #f3f4f6;
  color: #374151;
}
.ctrl-btn.active {
  background: #f0fdf4;
  border-color: #1a6b3c;
  color: #1a6b3c;
}
.spinning {
  animation: spin 1s linear infinite;
  font-size: 12px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
