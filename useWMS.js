import TileLayer from 'ol/layer/Tile'
import TileWMS from 'ol/source/TileWMS'
import ImageLayer from 'ol/layer/Image'
import ImageWMS from 'ol/source/ImageWMS'
import WMTS from 'ol/source/WMTS'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { get as getProjection } from 'ol/proj'
import { getTopLeft, getWidth } from 'ol/extent'

const GEOSERVER_WMS = 'http://localhost:8085/geoserver/kplc/wms'
const GEOSERVER_WMTS = 'http://localhost:8085/geoserver/kplc/gwc/service/wmts'

function buildWMTSTileGrid() {
  const projection = getProjection('EPSG:900913')
  const projExtent = projection.getExtent()
  const startResolution = getWidth(projExtent) / 256
  const resolutions = new Array(22)
  const matrixIds = new Array(22)
  for (let i = 0; i < 22; i++) {
    resolutions[i] = startResolution / Math.pow(2, i)
    matrixIds[i] = `EPSG:900913:${i}`
  }
  return new WMTSTileGrid({
    origin: getTopLeft(projExtent),
    resolutions,
    matrixIds,
  })
}
// ── WMS layer definitions ─────────────────────────────────────────────────────
export const WMS_LAYERS = [
  {
    id: 'wms_transmission',
    label: 'Transmission lines (WMS)',
    layers: 'kplc:lines_220kv,kplc:lines_132kv',
    color: '#dc2626',
  },
  {
    id: 'wms_distribution',
    label: 'Distribution network (WMS)',
    layers: 'kplc:lines_66kv,kplc:lines_33kv',
    color: '#2563eb',
  },
  {
    id: 'wms_stations',
    label: 'Stations (WMS)',
    layers: 'kplc:transmission_stations,kplc:primary_substations',
    color: '#1a6b3c',
  },
  {
    id: 'wms_transformers',
    label: 'Transformers (WMS)',
    layers: 'kplc:transformers',
    color: '#b45309',
  },
]

// ── WMTS layer definitions ────────────────────────────────────────────────────
export const WMTS_LAYERS = [
  {
    id: 'wmts_transmission',
    label: 'Transmission lines (WMTS)',
    layer: 'kplc:lines_220kv',
    color: '#dc2626',
  },
  {
    id: 'wmts_distribution',
    label: 'Distribution (WMTS)',
    layer: 'kplc:lines_33kv',
    color: '#7c3aed',
  },
  {
    id: 'wmts_stations',
    label: 'Stations (WMTS)',
    layer: 'kplc:transmission_stations',
    color: '#1a6b3c',
  },
]

// ── Create an ImageWMS layer ───────────────────────────────────────────────────
// ImageWMS fetches a single image per view — best for overlays
// TileWMS fetches tiles — better for large areas
export function createWMSLayer(layerDef, useTiled = false) {
  if (useTiled) {
    return new TileLayer({
      source: new TileWMS({
        url: GEOSERVER_WMS,
        params: {
          LAYERS: layerDef.layers,
          TILED: true,
          VERSION: '1.1.1',
          FORMAT: 'image/png',
          TRANSPARENT: true,
        },
        serverType: 'geoserver',
        crossOrigin: 'anonymous',
      }),
      opacity: 0.85,
      visible: false,
      properties: { layerId: layerDef.id, isWMS: true },
    })
  }

  return new ImageLayer({
    source: new ImageWMS({
      url: GEOSERVER_WMS,
      params: {
        LAYERS: layerDef.layers,
        VERSION: '1.1.1',
        FORMAT: 'image/png',
        TRANSPARENT: true,
      },
      serverType: 'geoserver',
      crossOrigin: 'anonymous',
    }),
    opacity: 0.85,
    visible: false,
    properties: { layerId: layerDef.id, isWMS: true },
  })
}
export function createWMTSLayer(layerDef) {
  const tileGrid = buildWMTSTileGrid()

  return new TileLayer({
    source: new WMTS({
      url: GEOSERVER_WMTS,
      layer: layerDef.layer,
      matrixSet: 'EPSG:900913',
      format: 'image/png',
      projection: 'EPSG:900913',
      tileGrid,
      style: '',
      wrapX: true,
      crossOrigin: 'anonymous',
    }),
    opacity: 0.85,
    visible: false,
    properties: { layerId: layerDef.id, serviceType: 'WMTS' },
  })
}
