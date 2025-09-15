'use client';
import { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';

import type { Device } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

const mapStyles = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#E8FFD7' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#E8FFD7' }, { weight: 2 }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3E5F44' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#D8F0C7' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#BDE0FE' }],
  },
];


export function MapView() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.006 });

  useEffect(() => {
    async function fetchDevices() {
      try {
        const response = await fetch('/api/devices');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Device[] = await response.json();
        setDevices(data);
        if (data.length > 0) {
            // Calculate center of all devices
            const totalLat = data.reduce((sum, d) => sum + d.coords.lat, 0);
            const totalLng = data.reduce((sum, d) => sum + d.coords.lng, 0);
            setCenter({ lat: totalLat / data.length, lng: totalLng / data.length });
        }
      } catch (e) {
        console.error('Failed to fetch devices:', e);
      }
    }

    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkerClick = (device: Device) => {
    setSelectedDevice(device);
  };
  
  const getPinColor = (status: Device['status']) => {
    switch (status) {
      case 'Normal':
        return { background: 'hsl(var(--primary))', glyphColor: '#FFF', borderColor: 'hsl(var(--primary))' };
      case 'Warning':
        return { background: '#FBBF24', glyphColor: '#FFF', borderColor: '#FBBF24' }; // yellow-400
      case 'Critical':
        return { background: 'hsl(var(--destructive))', glyphColor: '#FFF', borderColor: 'hsl(var(--destructive))' };
      default:
        return { background: '#9CA3AF', glyphColor: '#FFF', borderColor: '#9CA3AF' }; // gray-400
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Live Device Map</h2>
        <p className="text-muted-foreground">
          Geographical overview of your sensor network.
        </p>
      </div>
      <div className="relative w-full overflow-hidden rounded-lg border aspect-[16/9]">
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
          <Map
            center={center}
            zoom={12}
            mapId="envirowatch-map"
            styles={mapStyles}
            disableDefaultUI={true}
          >
            {devices.map((device) => (
              <AdvancedMarker
                key={device.id}
                position={device.coords}
                onClick={() => handleMarkerClick(device)}
              >
                <Pin {...getPinColor(device.status)} />
              </AdvancedMarker>
            ))}

            {selectedDevice && (
              <InfoWindow
                position={selectedDevice.coords}
                onCloseClick={() => setSelectedDevice(null)}
              >
                <div className="grid gap-4 p-2 w-64">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                        <h4 className="font-medium leading-none">{selectedDevice.name}</h4>
                        <Badge variant={selectedDevice.status === 'Critical' ? 'destructive' : 'secondary'}>{selectedDevice.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedDevice.location}
                    </p>
                  </div>
                  <div className="grid gap-1">
                    <div className="grid grid-cols-2 items-center">
                      <span className="text-sm font-medium">CO Level</span>
                      <span className="text-right">{selectedDevice.coLevel.toFixed(2)} ppm</span>
                    </div>
                     <div className="grid grid-cols-2 items-center">
                      <span className="text-sm font-medium">Last Update</span>
                      <span className="text-right text-sm text-muted-foreground">
                        {format(new Date(selectedDevice.timestamp), 'p, dd/MM/yy')}
                      </span>
                    </div>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
