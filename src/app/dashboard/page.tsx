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
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [criticalAlertsCount, setCriticalAlertsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
      setError("Failed to load device data. The server may be unavailable or still starting.");
    }
  }

  async function checkForAnomalies(newDevices: Device[]) {
    for (const device of newDevices) {
      if (device.historicalData && device.historicalData.length > 1) {
        const latestReading = device.historicalData[device.historicalData.length - 1];
        try {
          const result = await detectCoAnomaly({
            deviceId: device.id,
            coLevel: latestReading.coLevel,
            timestamp: latestReading.timestamp,
            historicalData: device.historicalData.slice(0, -1),
          });
          if (result.isAnomaly) {
            const anomalyAlert: Alert = {
              id: `anomaly-${device.id}-${latestReading.timestamp}`,
              deviceId: device.id,
              deviceName: device.name,
              message: result.explanation,
              timestamp: latestReading.timestamp,
              severity: 'Warning', 
            };
            
            setAlerts(prevAlerts => {
              const alertExists = prevAlerts.some(a => a.id === anomalyAlert.id);
              if (!alertExists) {
                toast({
                  title: `Anomaly Detected: ${device.name}`,
                  description: result.explanation,
                  variant: 'destructive'
                });
                return [anomalyAlert, ...prevAlerts].slice(0, 20);
              }
              return prevAlerts;
            });
          }
        } catch (e) {
          console.error(`AI Anomaly detection failed for ${device.id}:`, e);
        }
      }
    }
  }
  
  useEffect(() => {
    fetchDevices(); // Initial fetch
    const interval = setInterval(fetchDevices, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (devices.length > 0) {
      const critical = devices.filter(d => d.status === 'Critical').length;
      setCriticalAlertsCount(critical);
      
      const statusAlerts = devices
          .filter(d => d.status === 'Critical' || d.status === 'Warning')
          .map(d => ({
              id: `alert-${d.id}-${d.timestamp}`,
              deviceId: d.id,
              deviceName: d.name,
              message: `${d.status} CO level of ${d.coLevel.toFixed(2)} ppm detected.`,
              timestamp: d.timestamp,
              severity: d.status as 'Critical' | 'Warning'
          }));
      
      setAlerts(prevAlerts => {
        const newAlerts = statusAlerts.filter(
            newAlert => !prevAlerts.some(pa => pa.id === newAlert.id)
        );
        // Combine new status alerts with existing (anomaly) alerts
        return [...newAlerts, ...prevAlerts.filter(pa => !pa.id.startsWith('alert-'))].slice(0, 20);
      });

      checkForAnomalies(devices);
    }
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
          <p className="text-muted-foreground">Waiting for sensor data... This may take a moment.</p>
        </div>
      )}
    </div>
  );
}
