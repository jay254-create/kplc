<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="brand">
        <div class="brand-icon">KP</div>
        <div>
          <div class="brand-name">KPLC Grid WebGIS</div>
          <div class="brand-sub">Kenya Power Infrastructure</div>
        </div>
      </div>

      <!--<el-select
        v-model="selectedCounty"
        placeholder="Jump to county..."
        clearable
        filterable
        @change="onCountyChange"
        style="width: 100%; margin-top: 10px"
      >
        <el-option v-for="c in counties" :key="c.name" :label="c.name" :value="c.name" />
      </el-select>
      <el-button size="small" style="width: 100%; margin-top: 8px" @click="emit('toggle-legend')">
        🗺 Toggle map legend
      </el-button>

      <el-button
        :type="faultMode ? 'danger' : 'default'"
        size="small"
        style="width: 100%; margin-top: 8px"
        @click="emit('toggle-fault-mode')"
      >
        {{ faultMode ? '⚡ Fault mode ON — click a feature' : '⚡ Enable fault simulation' }}
      </el-button>

      <el-button size="small" style="width: 100%; margin-top: 8px" @click="emit('toggle-stats')">
        📊 Grid statistics
      </el-button>
      <el-button
        :type="splitScreen ? 'success' : 'default'"
        size="small"
        style="width: 100%; margin-top: 8px"
        @click="emit('toggle-split')"
      >
        🌐 {{ splitScreen ? 'Exit 3D view' : 'Enable 2D/3D split' }}
      </el-button>
      <el-button
        size="small"
        style="width: 100%; margin-top: 8px"
        @click="emit('toggle-wms-panel')"
      >
        🗺 WMS / WMTS layers
      </el-button>-->
      <div class="action-buttons">
        <button
          class="action-btn"
          :class="{ active: faultMode }"
          @click="emit('toggle-fault-mode')"
        >
          <span class="action-icon">⚡</span>
          <span>{{ faultMode ? 'Fault mode ON' : 'Fault simulation' }}</span>
        </button>

        <button class="action-btn" @click="emit('toggle-stats')">
          <span class="action-icon">📊</span>
          <span>Grid statistics</span>
        </button>

        <button class="action-btn" :class="{ active: splitScreen }" @click="emit('toggle-split')">
          <span class="action-icon">🌐</span>
          <span>{{ splitScreen ? 'Exit 3D view' : '2D / 3D split' }}</span>
        </button>

        <button class="action-btn" @click="emit('toggle-wms-panel')">
          <span class="action-icon">🗺</span>
          <span>WMS / WMTS layers</span>
        </button>

        <button class="action-btn" @click="emit('toggle-legend')">
          <span class="action-icon">📋</span>
          <span>Toggle legend</span>
        </button>
      </div>
    </div>

    <div class="layers-area">
      <div class="layers-label">Map layers</div>
      <LayerGroup
        v-for="group in layerGroups"
        :key="group.id"
        :group="group"
        @toggle-layer="emit('toggle-layer', $event)"
      />
    </div>

    <BasemapSwitcher @switch="emit('switch-basemap', $event)" />

    <div class="sidebar-footer">
      <div class="stat-row">
        <span class="stat-k">Features loaded</span>
        <span class="stat-v">{{ featureCount.toLocaleString() }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-k">Active county</span>
        <span class="stat-v">{{ selectedCounty || 'All Kenya' }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-k">Source</span>
        <span class="stat-v">GeoServer WFS</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { KENYA_COUNTIES } from '../data/counties.js'
import LayerGroup from './LayerGroup.vue'
import BasemapSwitcher from './BasemapSwitcher.vue'

defineProps({ layerGroups: Array, featureCount: Number, faultMode: Boolean, splitScreen: Boolean })

// ── FIX: capture the return value of defineEmits so emit() is callable ────────
const emit = defineEmits([
  'fly-to-county',
  'toggle-layer',
  'toggle-fault-mode',
  'switch-basemap',
  'toggle-stats',
  'toggle-split',
  'toggle-wms-panel',
  'toggle-legend',
])

const counties = KENYA_COUNTIES
const selectedCounty = ref('')

function onCountyChange(name) {
  if (!name) return
  const county = counties.find((c) => c.name === name)
  // ── FIX: now calls the captured emit function correctly ─────────────────────
  if (county) emit('fly-to-county', county.bbox)
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  min-width: 260px;
  max-width: 260px;
  flex-shrink: 0;
  flex-grow: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
  background: #fff;
  height: 100%;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
}
.sidebar-header {
  padding: 14px;
  border-bottom: 1px solid #f3f4f6;
  background: #fff;
  flex-shrink: 0;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, #1a6b3c, #059669);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 2px 8px rgba(26, 107, 60, 0.35);
}
.brand-name {
  font-size: 13px;
  font-weight: 700;
  color: #111;
  letter-spacing: -0.01em;
}
.brand-sub {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 1px;
}
.layers-area::-webkit-scrollbar {
  width: 4px;
}
.layers-area::-webkit-scrollbar-track {
  background: transparent;
}
.layers-area::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 4px;
}
.layers-label {
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 8px 14px 6px;
}
.sidebar-footer {
  padding: 10px 14px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #fafafa;
  flex-shrink: 0;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-k {
  font-size: 11px;
  color: #9ca3af;
}
.stat-v {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
}
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 10px;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  cursor: pointer;
  font-size: 12px;
  color: #374151;
  font-weight: 500;
  text-align: left;
  transition: all 0.12s;
}
.action-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}
.action-btn.active {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}
.action-btn.active .action-icon {
  filter: none;
}
.action-icon {
  font-size: 14px;
  flex-shrink: 0;
}
</style>
