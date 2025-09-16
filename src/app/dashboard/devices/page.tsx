
'use client'
import { DevicesTable } from '@/components/devices-table';
import { useState, useEffect } from 'react';
import type { Device } from '@/lib/types';

export default function DevicesPage() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDevices() {
            try {
                const response = await fetch('/api/devices');
                const data = await response.json();
                setDevices(data);
            } catch (error) {
                console.error('Failed to fetch devices', error);
            } finally {
                setLoading(false);
            }
        }
        fetchDevices();
        const intervalId = setInterval(fetchDevices, 5000);
        return () => clearInterval(intervalId);
    }, []);

    if (loading) {
        return <p>Loading devices...</p>;
    }

  return <DevicesTable devices={devices} />;
}
