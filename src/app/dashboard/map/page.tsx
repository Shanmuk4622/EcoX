
'use client';
import { MapView } from '@/components/map-view';
import type { Device } from '@/lib/types';

export default function MapPage({ devices }: { devices: Device[] }) {
  // The MapView component is now rendered directly from the main dashboard
  // This file can be simplified or used for a standalone map page.
  // For this refactor, we assume data is passed from the main dashboard.
  
  if (!devices) {
    return <p>Loading map data...</p>;
  }

  return <MapView devices={devices} />;
}
