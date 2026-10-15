<template>
  <transition name="panel-slide">
    <div v-if="show" class="fault-panel">
      <!-- Header -->
      <div class="panel-header">
        <div class="panel-title-row">
          <span class="panel-icon">⚡</span>
          <span class="panel-title">Fault Management</span>
          <span v-if="faultStore.activeFaults.length" class="fault-badge">
            {{ faultStore.activeFaults.length }} active
          </span>
        </div>
        <button class="panel-close" @click="$emit('close')">✕</button>
      </div>

      <!-- No faults state -->
      <div v-if="faultStore.faults.length === 0" class="panel-empty">
        <div class="empty-icon">✅</div>
        <div class="empty-text">No faults recorded</div>
        <div class="empty-sub">Click any line or station on the map to simulate a fault</div>
      </div>

      <template v-else>
        <!-- Stats row -->
        <div class="stats-row">
          <div class="stat-box active">
            <div class="stat-num">{{ faultStore.activeFaults.length }}</div>
            <div class="stat-label">Active</div>
          </div>
          <div class="stat-box resolved">
            <div class="stat-num">{{ faultStore.resolvedFaults.length }}</div>
            <div class="stat-label">Resolved</div>
          </div>
          <div class="stat-box total">
            <div class="stat-num">{{ faultStore.faults.length }}</div>
            <div class="stat-label">Total</div>
          </div>
        </div>

        <!-- Resolve all button -->
        <div v-if="faultStore.activeFaults.length" class="resolve-all-wrap">
          <button class="resolve-all-btn" @click="$emit('resolve-all')">
            ✓ Resolve all faults
          </button>
        </div>

        <!-- Active faults -->
        <div v-if="faultStore.activeFaults.length" class="section-label">Active faults</div>
        <div
          v-for="fault in faultStore.activeFaults"
          :key="fault.id"
          class="fault-card active-card"
        >
          <div class="fault-card-header">
            <span class="voltage-badge" :style="{ background: voltageColor(fault.layerId) }">
              {{ fault.voltage }}
            </span>
            <span class="fault-time">{{ formatTime(fault.reportedAt) }}</span>
          </div>
          <div class="fault-detail">
            <span class="detail-key">County</span>
            <span class="detail-val">{{ fault.county }}</span>
          </div>
          <div class="fault-detail">
            <span class="detail-key">Branch</span>
            <span class="detail-val">{{ fault.branch }}</span>
          </div>
          <div class="fault-detail">
            <span class="detail-key">Status</span>
            <span class="status-active">● Active</span>
          </div>
          <button class="resolve-btn" @click="$emit('resolve-fault', fault.id)">Resolve</button>
        </div>

        <!-- Resolved faults -->
        <div v-if="faultStore.resolvedFaults.length" class="section-label resolved-label">
          Resolved faults
        </div>
        <div
          v-for="fault in faultStore.resolvedFaults"
          :key="fault.id"
          class="fault-card resolved-card"
        >
          <div class="fault-card-header">
            <span class="voltage-badge resolved-badge">{{ fault.voltage }}</span>
            <span class="fault-time">{{ formatTime(fault.reportedAt) }}</span>
          </div>
          <div class="fault-detail">
            <span class="detail-key">County</span>
            <span class="detail-val">{{ fault.county }}</span>
          </div>
          <div class="fault-detail">
            <span class="detail-key">Resolved</span>
            <span class="detail-val">{{ formatTime(fault.resolvedAt) }}</span>
          </div>
          <div class="fault-detail">
            <span class="detail-key">Status</span>
            <span class="status-resolved">✓ Resolved</span>
          </div>
        </div>
      </template>
    </div>
  </transition>
</template>

<script setup>
import { useFaultStore } from '../stores/faultStore'

defineProps({ show: Boolean })
defineEmits(['close', 'resolve-fault', 'resolve-all'])

const faultStore = useFaultStore()

function voltageColor(layerId) {
  const map = {
    line_220: '#dc2626',
    line_132: '#ea580c',
    line_66: '#2563eb',
    line_33: '#7c3aed',
    line_11: '#0891b2',
    tx_station: '#1a6b3c',
    px_station: '#059669',
    transformer: '#b45309',
  }
  return map[layerId] || '#6b7280'
}

function formatTime(date) {
  return date ? new Date(date).toLocaleTimeString() : '—'
}
</script>

<style scoped>
.fault-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 260px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  z-index: 300;
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
.fault-badge {
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: #dc2626;
  border-radius: 10px;
  padding: 2px 7px;
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
.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
  gap: 8px;
  text-align: center;
}
.empty-icon {
  font-size: 28px;
}
.empty-text {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}
.empty-sub {
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.5;
}
.stats-row {
  display: flex;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}
.stat-box {
  flex: 1;
  border-radius: 8px;
  padding: 8px 6px;
  text-align: center;
}
.stat-box.active {
  background: #fef2f2;
}
.stat-box.resolved {
  background: #f0fdf4;
}
.stat-box.total {
  background: #f8fafc;
}
.stat-num {
  font-size: 18px;
  font-weight: 700;
  color: #111;
}
.stat-label {
  font-size: 10px;
  color: #6b7280;
  margin-top: 2px;
}
.resolve-all-wrap {
  padding: 8px 14px;
  flex-shrink: 0;
}
.resolve-all-btn {
  width: 100%;
  padding: 7px;
  border-radius: 7px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.resolve-all-btn:hover {
  background: #dcfce7;
}
.section-label {
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 6px 14px 4px;
  flex-shrink: 0;
}
.resolved-label {
  color: #6b7280;
}
.fault-card {
  margin: 4px 10px;
  border-radius: 8px;
  padding: 10px;
  border: 1px solid #fee2e2;
  background: #fff5f5;
  flex-shrink: 0;
}
.resolved-card {
  border-color: #d1fae5;
  background: #f0fdf4;
}
.fault-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.voltage-badge {
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  padding: 2px 7px;
  border-radius: 4px;
}
.resolved-badge {
  background: #6b7280 !important;
}
.fault-time {
  font-size: 10px;
  color: #9ca3af;
}
.fault-detail {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 11px;
}
.detail-key {
  color: #6b7280;
}
.detail-val {
  color: #111;
  font-weight: 500;
}
.status-active {
  color: #dc2626;
  font-size: 11px;
  font-weight: 600;
}
.status-resolved {
  color: #16a34a;
  font-size: 11px;
  font-weight: 600;
}
.resolve-btn {
  width: 100%;
  margin-top: 8px;
  padding: 5px;
  border-radius: 6px;
  border: 1px solid #fca5a5;
  background: #fff;
  color: #dc2626;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
.resolve-btn:hover {
  background: #fef2f2;
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
  transform: translateX(-12px);
}
</style>
