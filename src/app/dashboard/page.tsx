
'use client';

import { useState, useEffect, Suspense } from 'react';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { detectCoAnomaly } from '@/ai/flows/real-time-co-alerts';
import type { Device, Alert } from '@/lib/types';
import { OverviewCards } from '@/components/overview-cards';
import { COLevelsChart } from '@/components/co-levels-chart';
import { DeviceStatusPieChart } from '@/components/device-status-pie-chart';
import { RecentAlerts } from '@/components/recent-alerts';
import { Alert as UiAlert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DevicesTable } from '@/components/devices-table';
import { MapView } from '@/components/map-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeviceDetailsCard } from '@/components/device-details-card';
import AlertsPage from './alerts/page';
import { useSearchParams, useRouter } from 'next/navigation';

function DashboardComponent() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const { toast } = useToast();

  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (value: string) => {
    router.push(`/dashboard?tab=${value}`);
  };

  useEffect(() => {
    if (!db) {
      setError("Firestore is not configured. Please add your Firebase project configuration to your environment variables.");
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'devices'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const updatedDevicesMap = new Map<string, Device>(
        devices.map(d => [d.id, d])
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
          status: data.status || 'inactive',
          coLevel: newReading.coLevel,
          timestamp: newReading.timestamp,
          historicalData: [newReading, ...previousHistoricalData].slice(0, 20),
        };
        updatedDevicesMap.set(deviceId, updatedDevice);
      });

      const updatedDevices = Array.from(updatedDevicesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      
      setDevices(updatedDevices);
      
      if (updatedDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(updatedDevices[0]);
      } else if (selectedDevice) {
        const updatedSelected = updatedDevices.find(d => d.id === selectedDevice.id);
        if (updatedSelected) {
          setSelectedDevice(updatedSelected);
        }
      }

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Displaying live data from your sensors via Firestore.
        </p>
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
      
      {loading ? (
        <div className="text-center py-10">
            <p className="text-muted-foreground">Waiting for live sensor data from Firestore...</p>
        </div>
      ) : devices.length > 0 ? (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="devices">Devices</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
                <div className="flex flex-col gap-4">
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
            </TabsContent>
             <TabsContent value="devices">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-1">
                        <DevicesTable devices={devices} onSelectDevice={setSelectedDevice} selectedDevice={selectedDevice} />
                    </div>
                    <div className="lg:col-span-2">
                        <DeviceDetailsCard device={selectedDevice} />
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="map">
                <MapView devices={devices}/>
            </TabsContent>
            <TabsContent value="alerts">
                <AlertsPage alerts={alerts}/>
            </TabsContent>
        </Tabs>
      ) : !error && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No devices found in Firestore. Waiting for sensor data...</p>
          <p className="text-sm text-muted-foreground mt-2">If you have just started, you can seed initial data by visiting <a href="/api/seed" className="underline">/api/seed</a></p>
        </div>
      )}
    </div>
  );
}


export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardComponent />
    </Suspense>
  );
}
