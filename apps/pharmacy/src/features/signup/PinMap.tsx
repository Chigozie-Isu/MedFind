'use client';

/**
 * "Pin your door": an OpenStreetMap map (Leaflet) with a draggable pin. Tapping the map moves
 * the pin there too. Loaded only in the browser (Leaflet needs `window`).
 */
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

export interface LatLng {
  lat: number;
  lng: number;
}

/** The red "current location" style pin from Figma (Maps / Markers / Current Location Marker). */
const pinIcon = (placed: boolean) =>
  L.divIcon({
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<span style="display:block;width:26px;height:26px;border-radius:13px;background:rgba(162,25,25,0.3);position:relative;opacity:${placed ? 1 : 0.75}">
      <span style="position:absolute;left:6px;top:6px;width:10px;height:10px;border-radius:7px;background:#A21919;border:2px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.15)"></span></span>`,
  });

function Recenter({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center.lat, center.lng, map]);
  return null;
}

function ClickToPlace({ onPlace }: { onPlace: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPlace({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

export default function PinMap({
  center,
  pin,
  onPin,
}: {
  /** Where to look when there is no pin yet (the chosen city). */
  center: LatLng;
  pin: LatLng | null;
  onPin: (p: LatLng) => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  const position = pin ?? center;
  const handlers = useMemo(
    () => ({
      dragend: () => {
        const m = markerRef.current;
        if (m) onPin({ lat: m.getLatLng().lat, lng: m.getLatLng().lng });
      },
    }),
    [onPin],
  );
  return (
    <MapContainer center={[position.lat, position.lng]} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {!pin && <Recenter center={center} />}
      <ClickToPlace onPlace={onPin} />
      <Marker
        ref={markerRef}
        position={[position.lat, position.lng]}
        draggable
        eventHandlers={handlers}
        icon={pinIcon(!!pin)}
        keyboard
        title="Pharmacy door. Drag to move."
      />
    </MapContainer>
  );
}
