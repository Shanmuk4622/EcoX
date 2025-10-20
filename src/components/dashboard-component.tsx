
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { Device, Alert } from '@/lib/types';
import { Alert as UiAlert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DashboardTabs } from '@/components/dashboard-tabs';
import { Chatbot } from '@/components/chatbot';
import { useAudio } from '@/hooks/use-audio';

export function DashboardComponent() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const { toast } = useToast();
  const { playBeep, startContinuousBeep, stopContinuousBeep, isPlaying } = useAudio();

  const getDeviceStatus = useCallback((coLevel: number): Device['status'] => {
    if (coLevel >= 300) return 'Critical';
    if (coLevel >= 100) return 'Warning';
    return 'Normal';
  }, []);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    const { data: devicesData, error: devicesError } = await supabase
      .from('devices')
      .select(`
        id,
        name,
        location,
        lat,
        lng,
        readings ( co_level, timestamp )
      `);

    if (devicesError) {
      console.error("Failed to fetch devices from Supabase:", devicesError);
      setError("Failed to load device data. Please check your connection and Supabase setup.");
      setLoading(false);
      return;
    }

    const formattedDevices: Device[] = devicesData.map((device: any) => {
        const readings = device.readings.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const latestReading = readings[0] || { co_level: 0, timestamp: new Date().toISOString() };
        
        return {
            id: device.id,
            name: device.name || 'Unknown Device',
            location: device.location || 'Unknown Location',
            coords: { lat: device.lat || 0, lng: device.lng || 0 },
            coLevel: latestReading.co_level,
            timestamp: latestReading.timestamp,
            status: getDeviceStatus(latestReading.co_level),
            historicalData: readings.map((r: any) => ({ coLevel: r.co_level, timestamp: r.timestamp })).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
        };
    });

    const sortedDevices = formattedDevices.sort((a, b) => a.name.localeCompare(b.name));
    
    if (sortedDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(sortedDevices[0]);
    }
    
    setDevices(sortedDevices);
    setLoading(false);
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getDeviceStatus]);

  useEffect(() => {
    fetchInitialData();

    const readingsSubscription = supabase
      .channel('readings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'readings' }, (payload) => {
        console.log('New reading received:', payload);
        fetchInitialData(); // Refetch all data on new reading
      })
      .subscribe();

    return () => {
      supabase.removeChannel(readingsSubscription);
    };
  }, [fetchInitialData]);

  useEffect(() => {
    const isAnyDeviceCritical = devices.some(d => d.status === 'Critical');
    const areAllDevicesNormal = devices.every(d => d.coLevel < 100);

    if (isAnyDeviceCritical) {
      if (!isPlaying) startContinuousBeep();
    } else if (isPlaying && areAllDevicesNormal) {
      stopContinuousBeep();
    }
  }, [devices, isPlaying, startContinuousBeep, stopContinuousBeep]);

  useEffect(() => {
    if (devices.length > 0) {
      updateStatusAlerts(devices);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices]);

  function updateStatusAlerts(targetDevices: Device[]) {
    const statusAlerts = targetDevices
      .filter(d => (d.status === 'Critical' || d.status === 'Warning'))
      .map(d => ({
          id: `alert-${d.id}-${d.timestamp}`,
          deviceId: d.id,
          deviceName: d.name,
          location: d.location,
          message: `${d.status} CO level of ${d.coLevel.toFixed(2)} ppm detected.`,
          timestamp: d.timestamp,
          severity: d.status as 'Critical' | 'Warning'
      }));
    
    setAlerts(prevAlerts => {
      const alertIds = new Set(prevAlerts.map(a => a.id));
      const newStatusAlerts = statusAlerts.filter(a => !alertIds.has(a.id));
      
      if (newStatusAlerts.length === 0) return prevAlerts;

      newStatusAlerts.forEach(alert => {
        if (alert.severity === 'Warning') {
          playBeep(2);
        }
        toast({ 
            title: `${alert.severity} Alert: ${alert.deviceName}`,
            description: alert.message,
            variant: alert.severity === 'Critical' ? 'destructive' : 'default'
        });
      });

      return [...newStatusAlerts, ...prevAlerts]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 50);
    });
  }

  const criticalAlertsCount = alerts.filter(a => a.severity === 'Critical').length;

  if (loading) {
    return <div>Loading dashboard...</div>;
  }
  
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Displaying live data from your sensors via Supabase.
            </p>
          </div>
        </div>
      </div>

       {error && (
         <UiAlert variant="destructive">
           <Terminal className="h-4 w-4" />
           <AlertTitle>Connection Error</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </UiAlert>
       )}

       {criticalAlertsCount > 0 && (
         <UiAlert variant="destructive">
           <Terminal className="h-4 w-4" />
           <AlertTitle>Heads up! You have {criticalAlertsCount} critical alert(s).</AlertTitle>
           <AlertDescription>
             Please review the alerts section or the device list for more details.
           </AlertDescription>
         </UiAlert>
       )}
      
      <DashboardTabs
        devices={devices}
        alerts={alerts}
        selectedDevice={selectedDevice}
        onSelectDevice={setSelectedDevice}
      />
      <Chatbot devices={devices} alerts={alerts} />
    </div>
  );
}
