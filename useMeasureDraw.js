import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Draw from 'ol/interaction/Draw'
import { Style, Stroke, Fill, Circle as CircleStyle } from 'ol/style'
import { getArea, getLength } from 'ol/sphere'
import Overlay from 'ol/Overlay'

export function useMeasureDraw(map) {
  // ── Separate layers for measure (temp) and draw (persistent) ────────────────
  const measureSource = new VectorSource()
  const measureLayer = new VectorLayer({
    source: measureSource,
    zIndex: 996,
    style: new Style({
      stroke: new Stroke({ color: '#2563eb', width: 2.5, lineDash: [6, 6] }),
      fill: new Fill({ color: 'rgba(37, 99, 235, 0.1)' }),
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({ color: '#2563eb' }),
      }),
    }),
  })

  const drawSource = new VectorSource()
  const drawLayer = new VectorLayer({
    source: drawSource,
    zIndex: 995,
    style: new Style({
      stroke: new Stroke({ color: '#059669', width: 2.5 }),
      fill: new Fill({ color: 'rgba(5, 150, 105, 0.15)' }),
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: '#059669' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
    }),
  })

  let activeInteraction = null
  let measureTooltipEl = null
  let measureTooltip = null

  function addLayers() {
    map.addLayer(measureLayer)
    map.addLayer(drawLayer)
  }

  // ── Tooltip that follows the cursor during measurement ───────────────────────
  function createMeasureTooltip() {
    if (measureTooltipEl) {
      measureTooltipEl.remove()
    }
    measureTooltipEl = document.createElement('div')
    measureTooltipEl.className = 'measure-tooltip'
    measureTooltip = new Overlay({
      element: measureTooltipEl,
      offset: [0, -12],
      positioning: 'bottom-center',
      stopEvent: false,
    })
    map.addOverlay(measureTooltip)
  }

  function formatLength(line) {
    const length = getLength(line, { projection: map.getView().getProjection() })
    if (length > 1000) return `${(length / 1000).toFixed(2)} km`
    return `${length.toFixed(1)} m`
  }

  function formatArea(polygon) {
    const area = getArea(polygon, { projection: map.getView().getProjection() })
    if (area > 1_000_000) return `${(area / 1_000_000).toFixed(2)} km²`
    return `${area.toFixed(1)} m²`
  }

  function stopActiveInteraction() {
    if (activeInteraction) {
      map.removeInteraction(activeInteraction)
      activeInteraction = null
    }
    if (measureTooltipEl) {
      measureTooltipEl.remove()
      measureTooltipEl = null
    }
  }

  // ── Measure distance ──────────────────────────────────────────────────────
  function startMeasureDistance() {
    stopActiveInteraction()
    measureSource.clear()
    createMeasureTooltip()

    activeInteraction = new Draw({
      source: measureSource,
      type: 'LineString',
    })

    activeInteraction.on('drawstart', (evt) => {
      const sketch = evt.feature
      sketch.getGeometry().on('change', (e) => {
        const geom = e.target
        const output = formatLength(geom)
        const coord = geom.getLastCoordinate()
        measureTooltip.setPosition(coord)
        measureTooltipEl.innerHTML = output
      })
    })

    activeInteraction.on('drawend', () => {
      measureTooltipEl.className = 'measure-tooltip measure-tooltip-final'
      createMeasureTooltip()
    })

    map.addInteraction(activeInteraction)
  }

  // ── Measure area ──────────────────────────────────────────────────────────
  function startMeasureArea() {
    stopActiveInteraction()
    measureSource.clear()
    createMeasureTooltip()

    activeInteraction = new Draw({
      source: measureSource,
      type: 'Polygon',
    })

    activeInteraction.on('drawstart', (evt) => {
      const sketch = evt.feature
      sketch.getGeometry().on('change', (e) => {
        const geom = e.target
        const output = formatArea(geom)
        const coord = geom.getInteriorPoint().getCoordinates()
        measureTooltip.setPosition(coord)
        measureTooltipEl.innerHTML = output
      })
    })

    activeInteraction.on('drawend', () => {
      measureTooltipEl.className = 'measure-tooltip measure-tooltip-final'
      createMeasureTooltip()
    })

    map.addInteraction(activeInteraction)
  }

  // ── Draw point / line / polygon (persistent features) ────────────────────
  function startDraw(type) {
    stopActiveInteraction()
    activeInteraction = new Draw({
      source: drawSource,
      type, // 'Point' | 'LineString' | 'Polygon'
    })
    map.addInteraction(activeInteraction)
  }

  // ── Clear ──────────────────────────────────────────────────────────────────
  function clearMeasurements() {
    measureSource.clear()
    map
      .getOverlays()
      .getArray()
      .filter((o) => o.getElement()?.classList.contains('measure-tooltip'))
      .forEach((o) => map.removeOverlay(o))
  }

  function clearDrawings() {
    drawSource.clear()
  }

  function clearAll() {
    stopActiveInteraction()
    clearMeasurements()
    clearDrawings()
  }

  return {
    addLayers,
    startMeasureDistance,
    startMeasureArea,
    startDraw,
    stopActiveInteraction,
    clearMeasurements,
    clearDrawings,
    clearAll,
  }
}
