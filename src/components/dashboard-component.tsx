
'use client';

import { useState, useEffect, Suspense } from 'react';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { detectCoAnomaly } from '@/ai/flows/real-time-co-alerts';
import type { Device, Alert } from '@/lib/types';
import { Alert as UiAlert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DashboardTabs } from '@/components/dashboard-tabs';

function getDeviceStatus(coLevel: number): Device['status'] {
  if (coLevel >= 300) {
    return 'Critical';
  }
  if (coLevel >= 100) {
    return 'Warning';
  }
  return 'Normal';
}

export function DashboardComponent() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      setError("Firestore is not configured. Please add your Firebase project configuration to your environment variables.");
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'devices'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setDevices(prevDevices => {
        const updatedDevicesMap = new Map<string, Device>(
          prevDevices.map(d => [d.id, d])
        );

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const deviceId = doc.id;

          let timestampStr = new Date().toISOString();
          if (data.timestamp) {
              if (data.timestamp instanceof Timestamp) {
                  timestampStr = data.timestamp.toDate().toISOString();
              } else if (typeof data.timestamp === 'string') {
                  timestampStr = data.timestamp;
              } else if (data.timestamp._seconds) { 
                  timestampStr = new Date(data.timestamp._seconds * 1000).toISOString();
              }
          }
          
          const coLevel = typeof data.coLevel === 'number' ? data.coLevel : 0;
          const newReading = { coLevel, timestamp: timestampStr };

          const existingDevice = updatedDevicesMap.get(deviceId);
          const previousHistoricalData = existingDevice?.historicalData || [];

          const updatedDevice: Device = {
            id: deviceId,
            name: data.name || 'Unknown Device',
            location: data.location?.name || 'Unknown Location',
            coords: {
              lat: data.location?.lat || 0,
              lng: data.location?.lng || 0,
            },
            status: getDeviceStatus(newReading.coLevel),
            coLevel: newReading.coLevel,
            timestamp: newReading.timestamp,
            historicalData: [newReading, ...previousHistoricalData].slice(0, 20),
          };
          updatedDevicesMap.set(deviceId, updatedDevice);
        });

        const updatedDevices = Array.from(updatedDevicesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        
        if (updatedDevices.length > 0 && !selectedDevice) {
            setSelectedDevice(updatedDevices[0]);
        } else if (selectedDevice) {
            const updatedSelected = updatedDevices.find(d => d.id === selectedDevice.id);
            if (updatedSelected) {
            setSelectedDevice(updatedSelected);
            }
        }

        return updatedDevices;
      });

      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Failed to fetch devices from Firestore:", err);
      setError("Failed to load device data. Please check your connection and Firebase setup.");
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (devices.length > 0) {
      checkForAnomalies(devices);
      updateStatusAlerts(devices);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices]);

  async function checkForAnomalies(targetDevices: Device[]) {
    for (const device of targetDevices) {
      if (device.historicalData && device.historicalData.length > 1) {
        const latestReading = device.historicalData[0];
        try {
          const result = await detectCoAnomaly({
            deviceId: device.id,
            coLevel: latestReading.coLevel,
            timestamp: latestReading.timestamp,
            historicalData: device.historicalData.slice(1),
          });

          if (result.isAnomaly) {
            const anomalyAlert: Alert = {
              id: `anomaly-${device.id}-${latestReading.timestamp}`,
              deviceId: device.id,
              deviceName: device.name,
              location: device.location,
              message: result.explanation,
              timestamp: latestReading.timestamp,
              severity: 'Warning',
            };
            
            setAlerts(prevAlerts => {
              const alertExists = prevAlerts.some(a => a.id === anomalyAlert.id);
              if (!alertExists) {
                setTimeout(() => {
                  toast({
                    title: `AI Anomaly Detected: ${device.name}`,
                    description: result.explanation,
                  });
                }, 0);
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

      const allAlerts = [...newStatusAlerts, ...prevAlerts]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 50);

      return allAlerts;
    });
  }

  const criticalAlertsCount = alerts.filter(a => a.severity === 'Critical').length;

  if (loading) {
    return <div>Loading dashboard...</div>;
  }
  
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4 p-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Displaying live data from your sensors via Firestore.
          </p>
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
    </div>
  );
}
