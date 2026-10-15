<template>
  <div class="print-btn-wrap">
    <el-tooltip content="Export map as PNG" placement="top">
      <button class="print-btn" :class="{ loading: exporting }" @click="exportMap">
        <span v-if="!exporting">🖨</span>
        <el-icon v-else class="spinning"><Loading /></el-icon>
      </button>
    </el-tooltip>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({ mapInstance: Object })
const exporting = ref(false)

async function exportMap() {
  if (!props.mapInstance || exporting.value) return
  exporting.value = true

  try {
    // Force OL to render at full resolution
    props.mapInstance.once('rendercomplete', () => {
      const mapCanvas = document.createElement('canvas')
      const size = props.mapInstance.getSize()
      mapCanvas.width = size[0]
      mapCanvas.height = size[1]

      const ctx = mapCanvas.getContext('2d')

      // Composite all canvas layers
      document.querySelectorAll('.map-container canvas').forEach((canvas) => {
        if (canvas.width > 0) {
          ctx.drawImage(canvas, 0, 0)
        }
      })

      // Download
      const link = document.createElement('a')
      link.download = `kplc-grid-map-${new Date().toISOString().slice(0, 10)}.png`
      link.href = mapCanvas.toDataURL('image/png')
      link.click()

      exporting.value = false
    })

    props.mapInstance.renderSync()
  } catch (err) {
    console.error('Export failed:', err)
    exporting.value = false
  }
}
</script>

<style scoped>
.print-btn-wrap {
  display: inline-block;
}
.print-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  transition: background 0.12s;
}
.print-btn:hover {
  background: #f3f4f6;
}
.print-btn.loading {
  opacity: 0.7;
  cursor: wait;
}
.spinning {
  animation: spin 1s linear infinite;
  font-size: 14px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
