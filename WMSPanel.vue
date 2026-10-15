<!--<template>
  <transition name="panel-slide">
    <div v-if="show" class="wms-panel">
      <div class="panel-header">
        <div class="panel-title-row">
          <span class="panel-icon">🗺</span>
          <span class="panel-title">WMS Layers</span>
        </div>
        <button class="panel-close" @click="$emit('close')">✕</button>
      </div>

      <div class="panel-body">
        <div class="panel-desc">
          WMS layers are served as rasterized map images directly from GeoServer — styled
          server-side using SLD.
        </div>

        <div class="wms-list">
          <div v-for="layer in wmsLayers" :key="layer.id" class="wms-item">
            <div class="wms-left">
              <span class="wms-dot" :style="{ background: layer.color }"></span>
              <span class="wms-label">{{ layer.label }}</span>
            </div>
            <el-switch
              :model-value="layer.visible"
              size="small"
              @update:model-value="
                (val) => $emit('toggle-wms', { layerId: layer.id, visible: val })
              "
            />
          </div>
        </div>

        <div class="opacity-section">
          <div class="opacity-label">Layer opacity</div>
          <el-slider
            v-model="opacity"
            :min="10"
            :max="100"
            :step="5"
            size="small"
            @change="$emit('opacity-change', opacity / 100)"
          />
        </div>

        <div class="wms-info">
          <div class="info-row">
            <span class="info-key">Service</span>
            <span class="info-val">WMS 1.1.1</span>
          </div>
          <div class="info-row">
            <span class="info-key">Server</span>
            <span class="info-val">GeoServer 2.x</span>
          </div>
          <div class="info-row">
            <span class="info-key">Format</span>
            <span class="info-val">image/png</span>
          </div>
          <div class="info-row">
            <span class="info-key">Workspace</span>
            <span class="info-val">kplc</span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>-->

<!--<script setup>
import { ref } from 'vue'
import { WMS_LAYERS } from '../composables/useWMS.js'

defineProps({ show: Boolean })
defineEmits(['close', 'toggle-wms', 'opacity-change'])

const opacity = ref(85)
const wmsLayers = ref(WMS_LAYERS.map((l) => ({ ...l, visible: false })))

function setVisible(layerId, visible) {
  const layer = wmsLayers.value.find((l) => l.id === layerId)
  if (layer) layer.visible = visible
}

defineExpose({ setVisible })
</script>

<style scoped>
.wms-panel {
  position: absolute;
  top: 60px;
  right: 16px;
  width: 260px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  z-index: 290;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.13);
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #f3f4f6;
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
.panel-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.panel-desc {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.5;
}
.wms-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.wms-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}
.wms-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.wms-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.wms-label {
  font-size: 12px;
  color: #374151;
}
.opacity-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.opacity-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}
.wms-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.info-row {
  display: flex;
  justify-content: space-between;
}
.info-key {
  font-size: 11px;
  color: #9ca3af;
}
.info-val {
  font-size: 11px;
  color: #374151;
  font-weight: 500;
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
</style>-->
<template>
  <transition name="panel-slide">
    <div v-if="show" class="wms-panel">
      <div class="panel-header">
        <div class="panel-title-row">
          <span class="panel-icon">🗺</span>
          <span class="panel-title">WMS / WMTS Layers</span>
        </div>
        <button class="panel-close" @click="$emit('close')">✕</button>
      </div>

      <div class="panel-body">
        <!-- WMS Section -->
        <div class="section-label">
          WMS — Image layers
          <span class="service-badge wms">WMS</span>
        </div>
        <div class="service-desc">Single rasterized image per view, styled by GeoServer SLD</div>
        <div class="layer-list">
          <div v-for="layer in wmsLayers" :key="layer.id" class="layer-item">
            <div class="layer-left">
              <span class="layer-dot" :style="{ background: layer.color }"></span>
              <span class="layer-name">{{ layer.label }}</span>
            </div>
            <el-switch
              :model-value="layer.visible"
              size="small"
              @update:model-value="(val) => toggle(layer.id, val)"
            />
          </div>
        </div>

        <div class="divider"></div>

        <!-- WMTS Section -->
        <div class="section-label">
          WMTS — Tile layers
          <span class="service-badge wmts">WMTS</span>
        </div>
        <div class="service-desc">Pre-rendered tile cache from GeoWebCache — faster loading</div>
        <div class="layer-list">
          <div v-for="layer in wmtsLayers" :key="layer.id" class="layer-item">
            <div class="layer-left">
              <span class="layer-dot" :style="{ background: layer.color }"></span>
              <span class="layer-name">{{ layer.label }}</span>
            </div>
            <el-switch
              :model-value="layer.visible"
              size="small"
              @update:model-value="(val) => toggle(layer.id, val)"
            />
          </div>
        </div>

        <div class="divider"></div>

        <!-- Opacity slider -->
        <div class="opacity-row">
          <span class="opacity-label">Opacity</span>
          <el-slider
            v-model="opacity"
            :min="10"
            :max="100"
            :step="5"
            size="small"
            style="flex: 1"
            @change="$emit('opacity-change', opacity / 100)"
          />
          <span class="opacity-val">{{ opacity }}%</span>
        </div>

        <!-- Service info -->
        <div class="info-box">
          <div class="info-row">
            <span class="info-k">WMS endpoint</span>
            <span class="info-v">kplc/wms</span>
          </div>
          <div class="info-row">
            <span class="info-k">WMTS endpoint</span>
            <span class="info-v">kplc/gwc/service/wmts</span>
          </div>
          <div class="info-row">
            <span class="info-k">Server</span>
            <span class="info-v">GeoServer + GeoWebCache</span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'
import { WMS_LAYERS, WMTS_LAYERS } from '../composables/useWMS.js'

defineProps({ show: Boolean })
const emit = defineEmits(['close', 'toggle-wms', 'opacity-change'])

const opacity = ref(85)
const wmsLayers = ref(WMS_LAYERS.map((l) => ({ ...l, visible: false })))
const wmtsLayers = ref(WMTS_LAYERS.map((l) => ({ ...l, visible: false })))

function toggle(layerId, visible) {
  const wms = wmsLayers.value.find((l) => l.id === layerId)
  const wmts = wmtsLayers.value.find((l) => l.id === layerId)
  if (wms) wms.visible = visible
  if (wmts) wmts.visible = visible
  emit('toggle-wms', { layerId, visible })
}

function setVisible(layerId, visible) {
  const wms = wmsLayers.value.find((l) => l.id === layerId)
  const wmts = wmtsLayers.value.find((l) => l.id === layerId)
  if (wms) wms.visible = visible
  if (wmts) wmts.visible = visible
}

defineExpose({ setVisible })
</script>

<style scoped>
.wms-panel {
  position: absolute;
  top: 60px;
  right: 16px;
  width: 270px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  z-index: 290;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.13);
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #f3f4f6;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
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
.panel-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.service-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: 0.04em;
}
.service-badge.wms {
  background: #dbeafe;
  color: #1d4ed8;
}
.service-badge.wmts {
  background: #d1fae5;
  color: #065f46;
}
.service-desc {
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.4;
  margin-top: -4px;
}
.layer-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}
.layer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.layer-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.layer-name {
  font-size: 11px;
  color: #374151;
}
.divider {
  height: 1px;
  background: #f3f4f6;
  margin: 2px 0;
}
.opacity-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.opacity-label {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
}
.opacity-val {
  font-size: 11px;
  color: #374151;
  font-weight: 600;
  white-space: nowrap;
}
.info-box {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.info-k {
  font-size: 10px;
  color: #9ca3af;
}
.info-v {
  font-size: 10px;
  color: #374151;
  font-weight: 500;
  text-align: right;
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
