
'use client';

import { Device } from '@/lib/types';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import the LeafletMap component to ensure it's only loaded on the client-side
const LeafletMap = dynamic(() => import('@/components/leaflet-map').then(mod => mod.LeafletMap), {
  ssr: false
});

interface DeviceMapViewProps {
  devices: Device[];
  selectedDevice: Device | null;
}

export function DeviceMapView({ devices, selectedDevice }: DeviceMapViewProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set isClient to true once the component has mounted on the client
    setIsClient(true);
  }, []);

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-lg sm:h-[500px] md:h-[600px] lg:h-[700px]">
      {isClient ? (
        <LeafletMap devices={devices} selectedDevice={selectedDevice} />
      ) : (
        // Render a placeholder or loading indicator on the server
        <div>Loading map...</div>
      )}
    </div>
  );
}
