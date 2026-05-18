import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'

// Corrige ícone padrão do Leaflet com Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})

const geoCache = {}

async function geocode(city) {
  if (!city) return null
  const key = city.trim().toLowerCase()
  if (geoCache[key]) return geoCache[key]
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', Brasil')}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'pt-BR' } },
    )
    const data = await r.json()
    if (data.length > 0) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      geoCache[key] = coords
      return coords
    }
  } catch { /* silencioso */ }
  return null
}

export default function ExpeditionMap({ routes = [] }) {
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!routes.length) { setLoading(false); return }

    const cities = []
    routes.forEach(r => {
      if (r.from) cities.push({ city: r.from, label: r.from, leadsCount: 0 })
      if (r.to) cities.push({ city: r.to, label: r.to, leadsCount: r.leadsCount || 0 })
    })

    const unique = cities.filter(
      (c, i, arr) => arr.findIndex(x => x.city === c.city) === i,
    )

    Promise.all(unique.map(async (item) => {
      const coords = await geocode(item.city)
      return coords ? { ...item, coords } : null
    })).then(results => {
      setPoints(results.filter(Boolean))
      setLoading(false)
    })
  }, [routes])

  if (loading) return (
    <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl border border-gray-200 text-gray-400 text-sm">
      Carregando mapa...
    </div>
  )

  if (points.length === 0) return (
    <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl border border-gray-200 text-gray-400 text-sm">
      Nenhuma localização disponível para este roteiro.
    </div>
  )

  const center = points[Math.floor(points.length / 2)]?.coords || [-15.7797, -47.9297]
  const polyline = points.map(p => p.coords)

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 320 }}>
      <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={polyline} color="#059669" weight={3} opacity={0.7} dashArray="6 4" />
        {points.map((p, i) => (
          <Marker key={i} position={p.coords}>
            <Popup>
              <strong>{p.label}</strong>
              {p.leadsCount > 0 && <><br />{p.leadsCount} lead{p.leadsCount > 1 ? 's' : ''}</>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
