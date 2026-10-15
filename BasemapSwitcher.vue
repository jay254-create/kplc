<template>
  <div class="basemap-switcher">
    <div class="switcher-label">Background map</div>
    <div class="basemap-grid">
      <button
        v-for="bm in basemaps"
        :key="bm.id"
        class="bm-btn"
        :class="{ active: activeId === bm.id }"
        @click="select(bm.id)"
      >
        <span class="bm-icon">{{ bm.icon }}</span>
        <span class="bm-label">{{ bm.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { BASEMAPS } from '../composables/useBasemaps.js'

const emit = defineEmits(['switch'])
const activeId = ref('osm')
const basemaps = BASEMAPS

function select(id) {
  activeId.value = id
  emit('switch', id)
}
</script>

<style scoped>
.basemap-switcher {
  padding: 10px 14px;
  border-top: 1px solid #f3f4f6;
}
.switcher-label {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}
.basemap-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.bm-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 4px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.15s;
}
.bm-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}
.bm-btn.active {
  background: #f0fdf4;
  border-color: #1a6b3c;
  box-shadow: 0 0 0 1px #1a6b3c;
}
.bm-icon {
  font-size: 18px;
}
.bm-label {
  font-size: 10px;
  color: #374151;
  text-align: center;
  line-height: 1.3;
}
.bm-btn.active .bm-label {
  color: #1a6b3c;
  font-weight: 600;
}
</style>
