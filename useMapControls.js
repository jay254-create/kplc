import ScaleLine from 'ol/control/ScaleLine'
import MousePosition from 'ol/control/MousePosition'
import OverviewMap from 'ol/control/OverviewMap'
import { createStringXY } from 'ol/coordinate'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'

export function useMapControls(map) {
  // ── Scale bar ─────────────────────────────────────────────────────────────
  function addScaleLine() {
    const scaleLine = new ScaleLine({
      units: 'metric',
      bar: false,
      minWidth: 80,
      className: 'ol-scale-line',
    })
    map.addControl(scaleLine)
    return scaleLine
  }

  // ── Mouse position (coordinates display) ─────────────────────────────────
  function addMousePosition(targetElementId) {
    const mousePosition = new MousePosition({
      coordinateFormat: createStringXY(5),
      projection: 'EPSG:4326', // show as lon/lat degrees
      className: 'ol-mouse-position',
      target: document.getElementById(targetElementId),
      undefinedHTML: '&nbsp;',
    })
    map.addControl(mousePosition)
    return mousePosition
  }

  // ── Overview / eagle-eye map ──────────────────────────────────────────────
  function addOverviewMap() {
    const overview = new OverviewMap({
      className: 'ol-overviewmap ol-custom-overviewmap',
      layers: [new TileLayer({ source: new OSM() })],
      collapseLabel: '»',
      label: '«',
      collapsed: false,
    })
    map.addControl(overview)
    return overview
  }

  return { addScaleLine, addMousePosition, addOverviewMap }
}
