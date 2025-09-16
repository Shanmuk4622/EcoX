
'use client'
import { DevicesTable } from '@/components/devices-table';
import { useState, useEffect } from 'react';
import type { Device } from '@/lib/types';
import { DeviceDetailsCard } from '@/components/device-details-card';


export default function DevicesPage({ devices: initialDevices }: { devices: Device[] }) {
    const [devices, setDevices] = useState<Device[]>(initialDevices || []);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Data is now passed via props, but we can keep this for standalone use
        if (initialDevices) {
            setDevices(initialDevices);
            if (initialDevices.length > 0) {
                setSelectedDevice(initialDevices[0]);
            }
            setLoading(false);
        } else {
            async function fetchDevices() {
                try {
                    const response = await fetch('/api/devices');
                    const data = await response.json();
                    setDevices(data);
                    if (data.length > 0) {
                        setSelectedDevice(data[0]);
                    }
                } catch (error) {
                    console.error('Failed to fetch devices', error);
                } finally {
                    setLoading(false);
                }
            }
            fetchDevices();
        }
    }, [initialDevices]);


    if (loading && !initialDevices) {
        return <p>Loading devices...</p>;
    }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
            <DevicesTable devices={devices} onSelectDevice={setSelectedDevice} selectedDevice={selectedDevice} />
        </div>
        <div className="lg:col-span-2">
            <DeviceDetailsCard device={selectedDevice} />
        </div>
    </div>
  )
}
