<template>
  <div class="toolbar">
    <div class="toolbar-group">
      <button
        class="tool-btn"
        :class="{ active: activeTool === 'measure-distance' }"
        title="Measure distance"
        @click="select('measure-distance')"
      >
        <span class="tool-icon">📏</span>
      </button>
      <button
        class="tool-btn"
        :class="{ active: activeTool === 'measure-area' }"
        title="Measure area"
        @click="select('measure-area')"
      >
        <span class="tool-icon">📐</span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button
        class="tool-btn"
        :class="{ active: activeTool === 'draw-point' }"
        title="Draw point"
        @click="select('draw-point')"
      >
        <span class="tool-icon">📍</span>
      </button>
      <button
        class="tool-btn"
        :class="{ active: activeTool === 'draw-line' }"
        title="Draw line"
        @click="select('draw-line')"
      >
        <span class="tool-icon">📈</span>
      </button>
      <button
        class="tool-btn"
        :class="{ active: activeTool === 'draw-polygon' }"
        title="Draw polygon"
        @click="select('draw-polygon')"
      >
        <span class="tool-icon">▲</span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <button class="tool-btn clear-btn" title="Clear all" @click="clear">
      <span class="tool-icon">🗑</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['select-tool', 'clear'])
const activeTool = ref(null)

function select(tool) {
  if (activeTool.value === tool) {
    // Clicking the active tool again deactivates it
    activeTool.value = null
    emit('select-tool', null)
  } else {
    activeTool.value = tool
    emit('select-tool', tool)
  }
}

function clear() {
  activeTool.value = null
  emit('clear')
}

defineExpose({
  deactivate: () => {
    activeTool.value = null
  },
})
</script>

<style scoped>
.toolbar {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  padding: 4px;
  gap: 2px;
  z-index: 250;
}
.toolbar-group {
  display: flex;
  gap: 2px;
}
.toolbar-divider {
  width: 1px;
  height: 22px;
  background: #e5e7eb;
  margin: 0 2px;
}
.tool-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s;
}
.tool-btn:hover {
  background: #f3f4f6;
}
.tool-btn.active {
  background: #eff6ff;
  box-shadow: inset 0 0 0 1.5px #2563eb;
}
.tool-icon {
  font-size: 15px;
}
.clear-btn:hover {
  background: #fef2f2;
}
</style>
