import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(points, { padding: [50, 50] });
    } else if (points.length === 1) {
      map.setView(points[0], 7);
    }
  }, [map, points]);
  return null;
}

export default function TripMap({ destinations, selectedId, origin, onSelect }) {
  const dest = destinations.find((d) => d.id === selectedId);
  const o = origin.coords;
  const dpos = dest && dest.coords;

  return (
    <MapContainer className="tripmap" center={[23.8, 90.4]} zoom={6} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {destinations.map((d) => (
        <CircleMarker
          key={d.id}
          center={d.coords}
          radius={d.id === selectedId ? 11 : 6}
          pathOptions={{
            color: d.id === selectedId ? '#0a5f53' : '#0e7c6b',
            fillColor: d.id === selectedId ? '#0e7c6b' : '#5cc9b4',
            fillOpacity: 0.9,
            weight: 2,
          }}
          eventHandlers={{ click: () => onSelect(d.id) }}
        >
          <Tooltip>{d.name}</Tooltip>
        </CircleMarker>
      ))}
      {o && (
        <CircleMarker
          center={o}
          radius={8}
          pathOptions={{ color: '#92400e', fillColor: '#f59e0b', fillOpacity: 0.95, weight: 2 }}
        >
          <Tooltip>From: {origin.name}</Tooltip>
        </CircleMarker>
      )}
      {o && dpos && (
        <Polyline positions={[o, dpos]} pathOptions={{ color: '#0e7c6b', weight: 2.5, dashArray: '7 7' }} />
      )}
      <FitBounds points={o && dpos ? [o, dpos] : []} />
    </MapContainer>
  );
}
