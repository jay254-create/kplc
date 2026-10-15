<template>
  <div v-if="visible" class="heatmap-controls">
    <div class="slider-row">
      <span class="slider-label">Blur</span>
      <input
        type="range"
        min="5"
        max="40"
        :value="blur"
        @input="$emit('update-blur', Number($event.target.value))"
      />
      <span class="slider-val">{{ blur }}</span>
    </div>
    <div class="slider-row">
      <span class="slider-label">Radius</span>
      <input
        type="range"
        min="3"
        max="30"
        :value="radius"
        @input="$emit('update-radius', Number($event.target.value))"
      />
      <span class="slider-val">{{ radius }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({ visible: Boolean, blur: Number, radius: Number })
defineEmits(['update-blur', 'update-radius'])
</script>

<style scoped>
.heatmap-controls {
  padding: 6px 14px 10px;
  background: #f9fafb;
  border-radius: 0 0 8px 8px;
}
.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.slider-label {
  font-size: 11px;
  color: #6b7280;
  width: 40px;
}
.slider-val {
  font-size: 11px;
  color: #374151;
  width: 24px;
  text-align: right;
}
input[type='range'] {
  flex: 1;
  height: 4px;
}
</style>
