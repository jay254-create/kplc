<template>
  <transition name="legend-slide">
    <div v-if="visible" class="legend">
      <div class="legend-header">
        <span class="legend-title">Map Legend</span>
        <button class="legend-close" @click="$emit('close')">✕</button>
      </div>

      <div class="legend-body">
        <!-- Transmission lines -->
        <div class="legend-section">
          <div class="section-title">Transmission lines</div>
          <div class="legend-row">
            <span class="line-swatch" style="background: #dc2626; height: 3px"></span>
            <span>220 kV</span>
          </div>
          <div class="legend-row">
            <span class="line-swatch" style="background: #ea580c; height: 3px"></span>
            <span>132 kV</span>
          </div>
        </div>

        <!-- Distribution -->
        <div class="legend-section">
          <div class="section-title">Distribution network</div>
          <div class="legend-row">
            <span class="line-swatch" style="background: #2563eb; height: 2px"></span>
            <span>66 kV</span>
          </div>
          <div class="legend-row">
            <span class="line-swatch" style="background: #7c3aed; height: 2px"></span>
            <span>33 kV</span>
          </div>
          <div class="legend-row">
            <span class="line-swatch" style="background: #0891b2; height: 1.5px"></span>
            <span>11 kV</span>
          </div>
        </div>

        <!-- Stations -->
        <div class="legend-section">
          <div class="section-title">Stations</div>
          <div class="legend-row">
            <span class="point-swatch diamond" style="background: #1a6b3c"></span>
            <span>Transmission station</span>
          </div>
          <div class="legend-row">
            <span class="point-swatch diamond" style="background: #059669"></span>
            <span>Primary substation</span>
          </div>
        </div>

        <!-- Transformers -->
        <div class="legend-section">
          <div class="section-title">Other</div>
          <div class="legend-row">
            <span class="point-swatch circle" style="background: #b45309"></span>
            <span>Distribution transformer</span>
          </div>
          <div class="legend-row">
            <span class="heat-swatch"></span>
            <span>Transformer density</span>
          </div>
          <div class="legend-row">
            <span class="fault-swatch">⚠</span>
            <span>Active fault</span>
          </div>
          <div class="legend-row">
            <span
              class="line-swatch"
              style="
                background: #f97316;
                height: 2px;
                border-top: 2px dashed #f97316;
                background: none;
              "
            ></span>
            <span>Affected zone</span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({ visible: Boolean })
defineEmits(['close'])
</script>

<style scoped>
.legend {
  position: absolute;
  bottom: 48px;
  left: 12px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  z-index: 200;
  min-width: 190px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  backdrop-filter: blur(4px);
}
.legend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-bottom: 1px solid #f3f4f6;
}
.legend-title {
  font-size: 12px;
  font-weight: 700;
  color: #111;
}
.legend-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #9ca3af;
}
.legend-body {
  padding: 8px 12px 10px;
}
.legend-section {
  margin-bottom: 10px;
}
.legend-section:last-child {
  margin-bottom: 0;
}
.section-title {
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 5px;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #374151;
  margin-bottom: 4px;
}
.legend-row:last-child {
  margin-bottom: 0;
}
.line-swatch {
  display: inline-block;
  width: 26px;
  flex-shrink: 0;
  border-radius: 2px;
}
.point-swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}
.point-swatch.circle {
  border-radius: 50%;
}
.point-swatch.diamond {
  transform: rotate(45deg);
  border-radius: 2px;
}
.heat-swatch {
  display: inline-block;
  width: 26px;
  height: 8px;
  border-radius: 3px;
  flex-shrink: 0;
  background: linear-gradient(to right, #2563eb, #22c55e, #eab308, #dc2626);
}
.fault-swatch {
  font-size: 13px;
  width: 12px;
  text-align: center;
  flex-shrink: 0;
}
.legend-slide-enter-active,
.legend-slide-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.legend-slide-enter-from,
.legend-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
