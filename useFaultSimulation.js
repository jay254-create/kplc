import { ref } from 'vue'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Style, Stroke, Fill, Circle, Text } from 'ol/style'
import { Point } from 'ol/geom'
import Feature from 'ol/Feature'
import { getCenter } from 'ol/extent'
import { useFaultStore } from '../stores/faultStore'

export function useFaultSimulation(map, olLayerMap) {
  const faultStore = useFaultStore()
  const faultedFeatureIds = ref(new Set()) // osm_id or id of faulted features
  const affectedFeatureIds = ref(new Set()) // ids of downstream affected features

  // ── Fault marker layer (animated red dots) ────────────────────────────────
  const faultSource = new VectorSource()
  const faultLayer = new VectorLayer({
    source: faultSource,
    zIndex: 999, // always on top
    style: faultMarkerStyle,
  })

  // ── Affected zone layer (orange highlight) ────────────────────────────────
  const affectedSource = new VectorSource()
  const affectedLayer = new VectorLayer({
    source: affectedSource,
    zIndex: 998,
    style: affectedStyle,
  })

  function initFaultLayers() {
    map.addLayer(affectedLayer)
    map.addLayer(faultLayer)
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  function faultMarkerStyle(feature) {
    return new Style({
      image: new Circle({
        radius: 10,
        fill: new Fill({ color: 'rgba(220, 38, 38, 0.9)' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
      text: new Text({
        text: '⚠',
        font: 'bold 12px sans-serif',
        fill: new Fill({ color: '#fff' }),
        offsetY: 1,
      }),
    })
  }

  function affectedStyle(feature) {
    const geomType = feature.getGeometry().getType()
    if (geomType.includes('Line')) {
      return new Style({
        stroke: new Stroke({
          color: '#f97316',
          width: 4,
          lineDash: [8, 4],
        }),
      })
    }
    return new Style({
      image: new Circle({
        radius: 10,
        fill: new Fill({ color: 'rgba(249, 115, 22, 0.85)' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
    })
  }

  // ── Mark a feature as faulted ─────────────────────────────────────────────
  function triggerFault(clickedFeature) {
    const featureId =
      clickedFeature.get('id') || clickedFeature.get('osm_id') || clickedFeature.ol_uid
    const layerId = clickedFeature.get('_layerId')

    // Prevent duplicate faults on same feature
    if (faultedFeatureIds.value.has(featureId)) return

    faultedFeatureIds.value.add(featureId)

    // Place fault marker at center of the feature's extent
    const extent = clickedFeature.getGeometry().getExtent()
    const center = getCenter(extent)
    const marker = new Feature({ geometry: new Point(center) })
    marker.set('_faultFeatureId', featureId)
    faultSource.addFeature(marker)

    // Highlight the faulted feature itself in red
    clickedFeature.setStyle(
      new Style({
        stroke: new Stroke({ color: '#dc2626', width: 5 }),
        image: new Circle({
          radius: 10,
          fill: new Fill({ color: '#dc2626' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
      }),
    )

    // Find and highlight affected features in the same county/branch
    highlightAffected(clickedFeature)

    // Add to fault store
    faultStore.addFault({
      featureId,
      layerId,
      county: clickedFeature.get('County2') || clickedFeature.get('county2') || 'Unknown',
      branch: clickedFeature.get('Branch3') || clickedFeature.get('branch3') || 'Unknown',
      voltage: getVoltageLabel(layerId),
      location: center,
      feature: clickedFeature,
    })
  }

  // ── Highlight downstream affected features ────────────────────────────────
  // Simple approach: highlight all features in the same Branch and County
  // as the faulted feature — these are likely downstream consumers
  function highlightAffected(faultedFeature) {
    const county = faultedFeature.get('County2') || faultedFeature.get('county2')
    const branch = faultedFeature.get('Branch3') || faultedFeature.get('branch3')
    const faultedLayerId = faultedFeature.get('_layerId')

    // Only search distribution layers for affected features
    const searchLayers = ['line_33', 'line_11', 'transformer', 'px_station']

    for (const layerId of searchLayers) {
      const olLayer = olLayerMap[layerId]
      if (!olLayer) continue

      const features = olLayer.getSource().getFeatures()
      for (const f of features) {
        const fCounty = f.get('County2') || f.get('county2')
        const fBranch = f.get('Branch3') || f.get('branch3')

        // Match by county + branch — these are downstream of the fault
        if (fCounty === county && fBranch === branch) {
          const fId = f.get('id') || f.get('osm_id') || f.ol_uid
          if (!affectedFeatureIds.value.has(fId)) {
            affectedFeatureIds.value.add(fId)
            // Clone geometry into affected layer for orange highlighting
            const clone = new Feature({ geometry: f.getGeometry().clone() })
            clone.set('_sourceLayerId', layerId)
            affectedSource.addFeature(clone)
          }
        }
      }
    }
  }

  // ── Resolve a specific fault ───────────────────────────────────────────────
  function resolveFault(faultId) {
    const fault = faultStore.faults.find((f) => f.id === faultId)
    if (!fault) return

    // Remove fault marker
    const markers = faultSource.getFeatures()
    const marker = markers.find((m) => m.get('_faultFeatureId') === fault.featureId)
    if (marker) faultSource.removeFeature(marker)

    // Reset the faulted feature style back to default
    if (fault.feature) fault.feature.setStyle(null)

    // Remove from faulted set
    faultedFeatureIds.value.delete(fault.featureId)

    // If no more active faults — clear all affected highlighting
    faultStore.resolveFault(faultId)
    if (faultStore.activeFaults.length === 0) {
      affectedSource.clear()
      affectedFeatureIds.value.clear()
    }
  }

  // ── Resolve all faults ────────────────────────────────────────────────────
  function resolveAllFaults() {
    for (const fault of [...faultStore.activeFaults]) {
      if (fault.feature) fault.feature.setStyle(null)
      faultStore.resolveFault(fault.id)
    }
    faultSource.clear()
    affectedSource.clear()
    faultedFeatureIds.value.clear()
    affectedFeatureIds.value.clear()
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getVoltageLabel(layerId) {
    const map = {
      line_220: '220 kV',
      line_132: '132 kV',
      line_66: '66 kV',
      line_33: '33 kV',
      line_11: '11 kV',
      tx_station: 'Transmission',
      px_station: 'Primary',
      transformer: 'Distribution',
    }
    return map[layerId] || 'Unknown'
  }

  function formatTime(date) {
    return date ? new Date(date).toLocaleTimeString() : '—'
  }

  return {
    initFaultLayers,
    triggerFault,
    resolveFault,
    resolveAllFaults,
    formatTime,
  }
}
