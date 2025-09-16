
'use client';
import { MapView } from '@/components/map-view';
import { useState, useEffect } from 'react';
import type { Device } from '@/lib/types';

export default function MapPage() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDevices() {
            try {
                const response = await fetch('/api/devices');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: Device[] = await response.json();
                setDevices(data);
            } catch (e) {
                console.error('Failed to fetch devices:', e);
            } finally {
                setLoading(false);
            }
        }

        fetchDevices();
        const interval = setInterval(fetchDevices, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <p>Loading map data...</p>;
    }

  return <MapView devices={devices}/>;
}
