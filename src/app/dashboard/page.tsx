'use client';

import { useState, useEffect } from 'react';
import { detectCoAnomaly } from '@/ai/flows/real-time-co-alerts';
import { initialDevices } from '@/lib/data';
import type { Device, Alert } from '@/lib/types';
import { OverviewCards } from '@/components/overview-cards';
import { COLevelsChart } from '@/components/co-levels-chart';
import { DeviceStatusPieChart } from '@/components/device-status-pie-chart';
import { RecentAlerts } from '@/components/recent-alerts';
import { Alert as UiAlert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [criticalAlertsCount, setCriticalAlertsCount] = useState(0);

  useEffect(() => {
    const critical = devices.filter(d => d.status === 'Critical').length;
    setCriticalAlertsCount(critical);
  }, [devices]);

  useEffect(() => {
    const interval = setInterval(async () => {
      // Pick a random device to update
      const deviceIndex = Math.floor(Math.random() * devices.length);
      const deviceToUpdate = { ...devices[deviceIndex] };

      // Simulate new CO reading
      const isSpike = Math.random() < 0.1; // 10% chance of a spike
      const newCoLevel = isSpike
        ? parseFloat((20 + Math.random() * 30).toFixed(2)) // Spike
        : parseFloat(
            (
              deviceToUpdate.historicalData[
                deviceToUpdate.historicalData.length - 1
              ].coLevel +
              Math.random() * 2 -
              1
            ).toFixed(2)
          ); // Normal fluctuation

      const newReading = {
        coLevel: Math.max(0, newCoLevel),
        timestamp: new Date().toISOString(),
      };
      
      const updatedHistoricalData = [...deviceToUpdate.historicalData.slice(1), newReading];

      try {
        const anomalyResult = await detectCoAnomaly({
          deviceId: deviceToUpdate.id,
          coLevel: newReading.coLevel,
          timestamp: newReading.timestamp,
          historicalData: updatedHistoricalData,
        });

        const newStatus = anomalyResult.isAnomaly ? 'Critical' : 'Normal';
        
        if (anomalyResult.isAnomaly) {
            const newAlert: Alert = {
                id: `alert-${Date.now()}`,
                deviceId: deviceToUpdate.id,
                deviceName: deviceToUpdate.name,
                message: anomalyResult.explanation,
                timestamp: newReading.timestamp,
                severity: 'Critical',
            };
            setAlerts(prev => [newAlert, ...prev]);
        }

        const updatedDevices = devices.map((device, index) => {
          if (index === deviceIndex) {
            return {
              ...device,
              coLevel: newReading.coLevel,
              timestamp: newReading.timestamp,
              historicalData: updatedHistoricalData,
              status: newStatus,
            };
          }
          return device;
        });

        setDevices(updatedDevices);
        
      } catch (error) {
        console.error("Error detecting anomaly:", error);
      }
    }, 5000); // Run every 5 seconds

    return () => clearInterval(interval);
  }, [devices]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your real-time environmental overview.
        </p>
      </div>

       {criticalAlertsCount > 0 && (
         <UiAlert variant="destructive">
           <Terminal className="h-4 w-4" />
           <AlertTitle>Heads up! You have {criticalAlertsCount} critical alert(s).</AlertTitle>
           <AlertDescription>
             Please review the alerts section or the device list for more details.
           </AlertDescription>
         </UiAlert>
       )}

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
    </div>
  );
}
