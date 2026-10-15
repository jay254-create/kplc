<template>
  <transition name="panel-slide">
    <div v-if="show" class="stats-panel">
      <div class="panel-header">
        <div class="panel-title-row">
          <span class="panel-icon">📊</span>
          <span class="panel-title">Grid Statistics</span>
        </div>
        <button class="panel-close" @click="$emit('close')">✕</button>
      </div>

      <div class="panel-body">
        <!-- Summary metric cards -->
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-label">Total features</div>
            <div class="metric-value">{{ totalFeatures.toLocaleString() }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Line length</div>
            <div class="metric-value">{{ totalLengthKm }} km</div>
          </div>
        </div>

        <!-- Voltage chart -->
        <div class="chart-section">
          <div class="section-label">Assets by voltage level</div>
          <div class="chart-wrap">
            <canvas ref="voltageCanvas" role="img" :aria-label="voltageAriaLabel"></canvas>
          </div>
        </div>

        <!-- Asset type chart -->
        <div class="chart-section">
          <div class="section-label">Assets by type</div>
          <div class="chart-wrap">
            <canvas ref="typeCanvas" role="img" :aria-label="typeAriaLabel"></canvas>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'

const props = defineProps({
  show: Boolean,
  stats: {
    type: Object,
    default: () => ({
      line_220: 0,
      line_132: 0,
      line_66: 0,
      line_33: 0,
      line_11: 0,
      tx_station: 0,
      px_station: 0,
      transformer: 0,
      totalLengthKm: 0,
    }),
  },
})
defineEmits(['close'])

const voltageCanvas = ref(null)
const typeCanvas = ref(null)
let voltageChart = null
let typeChart = null

const totalFeatures = computed(() => {
  return Object.entries(props.stats)
    .filter(([k]) => k !== 'totalLengthKm')
    .reduce((sum, [, v]) => sum + (v || 0), 0)
})

const totalLengthKm = computed(() => {
  return Math.round(props.stats.totalLengthKm || 0).toLocaleString()
})

const VOLTAGE_LABELS = ['220 kV', '132 kV', '66 kV', '33 kV', '11 kV']
const VOLTAGE_KEYS = ['line_220', 'line_132', 'line_66', 'line_33', 'line_11']
const VOLTAGE_COLORS = ['#dc2626', '#ea580c', '#2563eb', '#7c3aed', '#0891b2']

const TYPE_LABELS = ['Transmission stations', 'Primary substations', 'Transformers']
const TYPE_KEYS = ['tx_station', 'px_station', 'transformer']
const TYPE_COLORS = ['#1a6b3c', '#059669', '#b45309']

const voltageAriaLabel = computed(() => {
  const parts = VOLTAGE_LABELS.map((l, i) => `${l}: ${props.stats[VOLTAGE_KEYS[i]] || 0}`)
  return `Bar chart of line counts by voltage level. ${parts.join(', ')}.`
})

const typeAriaLabel = computed(() => {
  const parts = TYPE_LABELS.map((l, i) => `${l}: ${props.stats[TYPE_KEYS[i]] || 0}`)
  return `Bar chart of asset counts by type. ${parts.join(', ')}.`
})

async function renderCharts() {
  if (!props.show) return
  console.log('[StatsPanel] Rendering with stats:', props.stats)
  await nextTick()

  const ChartJS = (await import('chart.js/auto')).default

  if (voltageChart) voltageChart.destroy()
  if (typeChart) typeChart.destroy()

  if (voltageCanvas.value) {
    voltageChart = new ChartJS(voltageCanvas.value, {
      type: 'bar',
      data: {
        labels: VOLTAGE_LABELS,
        datasets: [
          {
            data: VOLTAGE_KEYS.map((k) => props.stats[k] || 0),
            backgroundColor: VOLTAGE_COLORS,
            borderRadius: 4,
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 } } },
        },
      },
    })
  }

  if (typeCanvas.value) {
    typeChart = new ChartJS(typeCanvas.value, {
      type: 'bar',
      data: {
        labels: TYPE_LABELS,
        datasets: [
          {
            data: TYPE_KEYS.map((k) => props.stats[k] || 0),
            backgroundColor: TYPE_COLORS,
            borderRadius: 4,
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 } } },
          y: { grid: { display: false }, ticks: { font: { size: 10 } } },
        },
      },
    })
  }
}

watch(
  () => props.show,
  (val) => {
    if (val) renderCharts()
  },
)
watch(
  () => props.stats,
  () => {
    if (props.show) renderCharts()
  },
  { deep: true },
)

onUnmounted(() => {
  voltageChart?.destroy()
  typeChart?.destroy()
})
</script>

<style scoped>
.stats-panel {
  position: absolute;
  top: 16px;
  right: 280px;
  width: 280px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  z-index: 290;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.13);
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}
.panel-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.panel-icon {
  font-size: 15px;
}
.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #111;
}
.panel-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #9ca3af;
}
.panel-close:hover {
  color: #374151;
}
.panel-body {
  padding: 12px 14px;
  overflow-y: auto;
}
.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}
.metric-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px;
}
.metric-label {
  font-size: 10px;
  color: #9ca3af;
  margin-bottom: 4px;
}
.metric-value {
  font-size: 18px;
  font-weight: 700;
  color: #111;
}
.chart-section {
  margin-bottom: 18px;
}
.section-label {
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}
.chart-wrap {
  position: relative;
  height: 160px;
}
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
