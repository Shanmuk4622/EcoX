'use client';

import { useState, useEffect } from 'react';
import { detectCoAnomaly } from '@/ai/flows/real-time-co-alerts';
import type { Device, Alert } from '@/lib/types';
import { OverviewCards } from '@/components/overview-cards';
import { COLevelsChart } from '@/components/co-levels-chart';
import { DeviceStatusPieChart } from '@/components/device-status-pie-chart';
import { RecentAlerts } from '@/components/recent-alerts';
import { Alert as UiAlert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [criticalAlertsCount, setCriticalAlertsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function fetchDevices() {
    try {
      const response = await fetch('/api/devices');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDevices(data);
      setError(null);
    } catch (e) {
      console.error("Failed to fetch devices:", e);
      setError("Failed to load device data. The server may be unavailable.");
    }
  }

  useEffect(() => {
    fetchDevices(); // Initial fetch
    const interval = setInterval(fetchDevices, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const critical = devices.filter(d => d.status === 'Critical').length;
    setCriticalAlertsCount(critical);
    
    const recentCriticalAlerts = devices
        .filter(d => d.status === 'Critical')
        .map(d => ({
            id: `alert-${d.id}-${d.timestamp}`,
            deviceId: d.id,
            deviceName: d.name,
            message: `Critical CO level of ${d.coLevel.toFixed(2)} ppm detected.`,
            timestamp: d.timestamp,
            severity: 'Critical' as const
        }));
    
    // This is a simplified way to manage alerts. A more robust solution would be needed for production.
    setAlerts(prevAlerts => {
        const newAlerts = recentCriticalAlerts.filter(
            newAlert => !prevAlerts.some(pa => pa.deviceId === newAlert.deviceId && pa.timestamp === newAlert.timestamp)
        );
        return [...newAlerts, ...prevAlerts].slice(0, 20); // Keep last 20 alerts
    });


  }, [devices]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your real-time environmental overview.
        </p>
      </div>

       {error && (
         <UiAlert variant="destructive">
           <Terminal className="h-4 w-4" />
           <AlertTitle>Connection Error</AlertTitle>
           <AlertDescription>
             {error}
           </AlertDescription>
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
      
      {devices.length > 0 ? (
        <>
          <OverviewCards devices={devices} alerts={alerts} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <COLevelsChart devices={devices} />
            </div>
            <div className="lg:col-span-3 grid gap-4">
              <DeviceStatusPieChart devices={devices} />
              <RecentAlerts alerts={alerts} />
            </div>
          </div>
        </>
      ) : !error && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Waiting for sensor data...</p>
        </div>
      )}
    </div>
  );
}
