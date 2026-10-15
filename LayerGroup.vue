<template>
  <div class="group">
    <div class="group-header" @click="open = !open">
      <div class="group-left">
        <span class="group-dot" :style="{ background: group.color }"></span>
        <span class="group-label">{{ group.label }}</span>
        <span class="group-count">{{ group.layers.length }}</span>
      </div>
      <el-icon class="chevron" :class="{ rotated: open }"><ArrowRight /></el-icon>
    </div>

    <transition name="slide">
      <div v-if="open" class="layer-list">
        <div v-for="layer in group.layers" :key="layer.id" class="layer-item">
          <div class="layer-left">
            <span class="layer-swatch" :style="swatchStyle(layer)"></span>
            <span class="layer-name">{{ layer.label }}</span>
          </div>
          <el-switch
            :model-value="layer.visible"
            size="small"
            @update:model-value="
              (val) => $emit('toggle-layer', { layerId: layer.id, visible: val })
            "
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'

const props = defineProps({ group: Object })
defineEmits(['toggle-layer'])
const open = ref(props.group.open ?? true)

function swatchStyle(layer) {
  if (layer.shape === 'line')
    return { background: layer.color, width: '24px', height: '3px', borderRadius: '2px' }
  if (layer.shape === 'dot')
    return { background: layer.color, width: '10px', height: '10px', borderRadius: '50%' }
  return { background: layer.color, width: '10px', height: '10px', borderRadius: '3px' }
}
</script>

<style scoped>
.group {
  border-bottom: 1px solid #f3f4f6;
}
.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 14px;
  cursor: pointer;
  user-select: none;
}
.group-header:hover {
  background: #f9fafb;
}
.group-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.group-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.group-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}
.group-count {
  font-size: 10px;
  color: #9ca3af;
  background: #f3f4f6;
  border-radius: 10px;
  padding: 1px 6px;
}
.chevron {
  font-size: 12px;
  color: #9ca3af;
  transition: transform 0.2s;
}
.chevron.rotated {
  transform: rotate(90deg);
}
.layer-list {
  padding: 4px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-radius: 6px;
  background: #f9fafb;
}
.layer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.layer-swatch {
  display: inline-block;
  flex-shrink: 0;
}
.layer-name {
  font-size: 11px;
  color: #6b7280;
}
.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
