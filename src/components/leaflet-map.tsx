
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Device } from '@/lib/types';
import { useEffect, useRef } from 'react';

interface LeafletMapProps {
  devices: Device[];
  selectedDevice: Device | null;
}

export function LeafletMap({ devices, selectedDevice }: LeafletMapProps) {
  const position = selectedDevice
    ? [selectedDevice.coords.lat, selectedDevice.coords.lng]
    : [40.7128, -74.006];
  const zoom = selectedDevice ? 13 : 5;
  const mapRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  return (
    <MapContainer
      whenCreated={(map) => (mapRef.current = map)}
      center={position}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {devices.map((device) => (
        <Marker key={device.id} position={[device.coords.lat, device.coords.lng]}>
          <Popup>
            <div>
              <h3>{device.name}</h3>
              <p>CO Level: {device.coLevel} ppm</p>
              <p>Status: {device.status}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
