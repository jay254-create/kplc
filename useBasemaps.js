import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'

// ── Basemap definitions only — no map logic here ──────────────────────────────
export const BASEMAPS = [
  {
    id: 'osm',
    label: 'OpenStreetMap',
    icon: '🗺',
    makeSource: () => new OSM(),
  },
  {
    id: 'arcgis_street',
    label: 'ArcGIS Street',
    icon: '🏙',
    makeSource: () =>
      new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19,
        crossOrigin: 'anonymous',
        attributions: 'Tiles © Esri',
      }),
  },
  {
    id: 'arcgis_satellite',
    label: 'Esri Satellite',
    icon: '🛰',
    makeSource: () =>
      new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19,
        thumbClass: 'thumb-sat',
        crossOrigin: 'anonymous',
        attributions: '© Esri, GeoEye, Maxar',
      }),
  },
  {
    id: 'osm_topo',
    label: 'Topo',
    icon: '⛰',
    makeSource: () =>
      new XYZ({
        url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
        maxZoom: 19,
        crossOrigin: 'anonymous',
        attributions: '© OpenTopoMap',
      }),
  },
  {
    id: 'stadia_smooth',
    label: 'Stadia Smooth',
    icon: '🎨',
    makeSource: () =>
      new XYZ({
        url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png',
        maxZoom: 20,
        crossOrigin: 'anonymous',
        attributions: '© Stadia Maps',
      }),
  },
  {
    id: 'stadia_dark',
    label: 'Stadia Dark',
    icon: '🌙',
    makeSource: () =>
      new XYZ({
        url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
        maxZoom: 20,
        crossOrigin: 'anonymous',
        attributions: '© Stadia Maps',
      }),
  },
]
