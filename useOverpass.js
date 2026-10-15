import axios from 'axios'
import GeoJSON from 'ol/format/GeoJSON'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

function buildQuery(bbox) {
  const [w, s, e, n] = bbox
  const b = `${s},${w},${n},${e}`
  return `
    [out:json][timeout:60];
    (
      way["power"="line"](${b});
      node["power"="tower"](${b});
      node["power"="pole"](${b});
      node["power"="substation"](${b});
      node["power"="generator"](${b});
      way["power"="substation"](${b});
    );
    out geom;
  `
}

function osmToGeoJSON(data) {
  const features = []

  for (const el of data.elements) {
    if (el.type === 'node') {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [el.lon, el.lat] },
        properties: { ...el.tags, osm_id: el.id, osm_type: el.type },
      })
    } else if (el.type === 'way' && el.geometry) {
      const coords = el.geometry.map((p) => [p.lon, p.lat])
      const isPolygon = el.tags?.power === 'substation' && coords.length > 2
      features.push({
        type: 'Feature',
        geometry: isPolygon
          ? { type: 'Polygon', coordinates: [coords] }
          : { type: 'LineString', coordinates: coords },
        properties: { ...el.tags, osm_id: el.id, osm_type: el.type },
      })
    }
  }

  return { type: 'FeatureCollection', features }
}

export function useOverpass() {
  async function fetchPowerData(bbox) {
    const query = buildQuery(bbox)
    const res = await axios.post(OVERPASS_URL, 'data=' + encodeURIComponent(query), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return osmToGeoJSON(res.data)
  }

  return { fetchPowerData }
}
