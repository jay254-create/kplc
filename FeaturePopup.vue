<template>
  <div v-if="feature" class="popup">
    <div class="popup-header">
      <div class="popup-title-wrap">
        <span class="popup-badge" :style="{ background: meta.color }">
          {{ meta.label }}
        </span>
        <span class="popup-title">{{ title }}</span>
      </div>
      <button class="popup-close" @click="$emit('close')">✕</button>
    </div>

    <div class="popup-body">
      <div v-if="rows.length === 0" class="popup-empty">No attributes available</div>
      <div v-for="row in rows" :key="row.key" class="popup-row">
        <span class="popup-key">{{ row.label }}</span>
        <span class="popup-val">{{ row.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ feature: Object })
defineEmits(['close'])

// ── Layer metadata ────────────────────────────────────────────────────────────
const LAYER_META = {
  line_220: { label: '220 kV Line', color: '#dc2626' },
  line_132: { label: '132 kV Line', color: '#ea580c' },
  line_66: { label: '66 kV Line', color: '#2563eb' },
  line_33: { label: '33 kV Line', color: '#7c3aed' },
  line_11: { label: '11 kV Line', color: '#0891b2' },
  tx_station: { label: 'Transmission Station', color: '#1a6b3c' },
  px_station: { label: 'Primary Substation', color: '#059669' },
  transformer: { label: 'Distribution Transformer', color: '#b45309' },
}

// ── Field label maps per layer ────────────────────────────────────────────────
// Keys must match exactly what GeoServer returns in the WFS response.
// If a field is missing from the popup, check DevTools → Network → the WFS
// request response to see the exact property names GeoServer sends back.
const FIELD_MAPS = {
  line_hv: [
    { key: 'rcc1', label: 'Region' },
    { key: 'county2', label: 'County' },
    { key: 'branch3', label: 'Branch' },
    { key: 'feeder_o10', label: 'Feeder origin' },
    { key: 'feeder_o17', label: 'Feeder' },
    { key: 'voltage40', label: 'Voltage (kV)' },
    { key: 'length_km', label: 'Length (km)' },
    // Fallbacks with original casing in case GeoServer preserves case
    { key: 'RCC1', label: 'Region' },
    { key: 'County2', label: 'County' },
    { key: 'Branch3', label: 'Branch' },
    { key: 'Feeder_o10', label: 'Feeder origin' },
    { key: 'voltage40', label: 'Voltage (kV)' },
    { key: 'Length_km', label: 'Length (km)' },
  ],
  line_mv: [
    { key: 'rcc1', label: 'Region' },
    { key: 'county2', label: 'County' },
    { key: 'branch3', label: 'Branch' },
    { key: 'origin_o20', label: 'Origin substation' },
    { key: 'feeder_o21', label: 'Feeder' },
    { key: 'voltage48', label: 'Voltage (kV)' },
    { key: 'length_m_', label: 'Length (m)' },
    // Fallbacks
    { key: 'RCC1', label: 'Region' },
    { key: 'County2', label: 'County' },
    { key: 'Branch3', label: 'Branch' },
    { key: 'Origin_o20', label: 'Origin substation' },
    { key: 'Feeder_o21', label: 'Feeder' },
    { key: 'voltage48', label: 'Voltage (kV)' },
    { key: 'Length_m_', label: 'Length (m)' },
  ],
  tx_station: [
    { key: 'Name_IMS11', label: 'Station name' },
    { key: 'name_ims11', label: 'Station name' },
    { key: 'RCC1', label: 'Region' },
    { key: 'rcc1', label: 'Region' },
    { key: 'County2', label: 'County' },
    { key: 'county2', label: 'County' },
    { key: 'Branch3', label: 'Branch' },
    { key: 'branch3', label: 'Branch' },
    { key: 'Ownershi23', label: 'Ownership' },
    { key: 'ownershi23', label: 'Ownership' },
    { key: 'Manned50', label: 'Manned' },
    { key: 'manned50', label: 'Manned' },
    { key: 'Type_Acc42', label: 'Access type' },
    { key: 'type_acc42', label: 'Access type' },
  ],
  px_station: [
    { key: 'Name8', label: 'Station name' },
    { key: 'name8', label: 'Station name' },
    { key: 'Name_IMS11', label: 'Full name' },
    { key: 'name_ims11', label: 'Full name' },
    { key: 'RCC1', label: 'Region' },
    { key: 'rcc1', label: 'Region' },
    { key: 'County2', label: 'County' },
    { key: 'county2', label: 'County' },
    { key: 'Branch3', label: 'Branch' },
    { key: 'branch3', label: 'Branch' },
    { key: 'Ownershi24', label: 'Ownership' },
    { key: 'ownershi24', label: 'Ownership' },
    { key: 'Outgoing48', label: 'Outgoing feeders' },
    { key: 'outgoing48', label: 'Outgoing feeders' },
    { key: 'Manned50', label: 'Manned' },
    { key: 'manned50', label: 'Manned' },
  ],
  transformer: [
    { key: 'Substati9', label: 'Type' },
    { key: 'substati9', label: 'Type' },
    { key: 'DCS_Cate15', label: 'Category' },
    { key: 'dcs_cate15', label: 'Category' },
    { key: 'RCC1', label: 'Region' },
    { key: 'rcc1', label: 'Region' },
    { key: 'County2', label: 'County' },
    { key: 'county2', label: 'County' },
    { key: 'Branch3', label: 'Branch' },
    { key: 'branch3', label: 'Branch' },
    { key: 'Feeder_o28', label: 'Feeder' },
    { key: 'feeder_o28', label: 'Feeder' },
    { key: 'Road', label: 'Road' },
    { key: 'road', label: 'Road' },
  ],
}

function getFieldMap(layerId) {
  if (['line_220', 'line_132', 'line_66'].includes(layerId)) return FIELD_MAPS.line_hv
  if (['line_33', 'line_11'].includes(layerId)) return FIELD_MAPS.line_mv
  return FIELD_MAPS[layerId] ?? []
}

// ── Computed ──────────────────────────────────────────────────────────────────
const layerId = computed(() => props.feature?.get('_layerId') ?? '')
const meta = computed(() => LAYER_META[layerId.value] ?? { label: 'Feature', color: '#6b7280' })

const title = computed(() => {
  if (!props.feature) return ''
  const f = props.feature
  // Try common name fields in order of preference
  return (
    f.get('Name_IMS11') ||
    f.get('name_ims11') ||
    f.get('Name8') ||
    f.get('name8') ||
    f.get('Branch3') ||
    f.get('branch3') ||
    f.get('Feeder_o21') ||
    f.get('feeder_o21') ||
    f.get('Feeder_o10') ||
    f.get('feeder_o10') ||
    meta.value.label
  )
})

const rows = computed(() => {
  if (!props.feature) return []

  const fields = getFieldMap(layerId.value)
  const seen = new Set() // prevent duplicate labels when both cases match
  const result = []

  for (const { key, label } of fields) {
    if (seen.has(label)) continue
    const value = props.feature.get(key)
    if (value !== null && value !== undefined && value !== '') {
      result.push({ key, label, value })
      seen.add(label)
    }
  }

  // Fallback: if nothing matched (field names differ from what we expect),
  // show ALL raw properties so we can see what GeoServer actually sent
  if (result.length === 0) {
    const keys = props.feature.getKeys().filter((k) => k !== 'geometry' && k !== '_layerId')
    for (const k of keys) {
      const value = props.feature.get(k)
      if (value !== null && value !== undefined && value !== '') {
        result.push({ key: k, label: k, value })
      }
    }
  }

  return result
})
</script>

<style scoped>
.popup {
  position: sticky;
  top: 60px;
  right: 10px;
  width: 200px;
  background: hwb(0 95% 3%);
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  max-height: 400px;
  display: flex;
  flex-direction: column;
}
.popup-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10px 12px 8px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}
.popup-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.popup-badge {
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  padding: 2px 7px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.popup-title {
  font-size: 12px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}
.popup-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #9ca3af;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
  margin-left: 6px;
}
.popup-close:hover {
  color: #374151;
}
.popup-body {
  padding: 6px 12px 10px;
  overflow-y: auto;
}
.popup-empty {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  padding: 10px 0;
}
.popup-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 5px 0;
  border-bottom: 1px solid #f9fafb;
  gap: 8px;
}
.popup-row:last-child {
  border-bottom: none;
}
.popup-key {
  font-size: 11px;
  color: #0a0a0a;
  white-space: nowrap;
  flex-shrink: 0;
  font-family: 'Times New Roman', Times, serif;
}
.popup-val {
  font-size: 11px;
  color: #111827;
  font-weight: 500;
  text-align: right;
  word-break: break-word;
  max-width: 150px;
}
</style>
