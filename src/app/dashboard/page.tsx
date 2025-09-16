
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { detectCoAnomaly } from '@/ai/flows/real-time-co-alerts';
import type { Device, Alert, HistoricalData } from '@/lib/types';
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

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
        setError("Firestore client is not available. Please check your Firebase configuration.");
        setLoading(false);
        return;
    }
    const q = query(collection(db, 'devices'), orderBy('name'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const devicesData: Device[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        let timestampStr = new Date().toISOString();
        if (data.timestamp) {
            if (data.timestamp instanceof Timestamp) {
                timestampStr = data.timestamp.toDate().toISOString();
            } else if (typeof data.timestamp === 'string') {
                timestampStr = data.timestamp;
            }
        }
        
        let locationName = 'Unknown Location';
        if (typeof data.location === 'string') {
            locationName = data.location;
        } else if (typeof data.location === 'object' && data.location.name) {
            locationName = data.location.name;
        }

        devicesData.push({
          id: doc.id,
          name: data.name || 'Unknown Device',
          location: locationName,
          coords: data.coords || { lat: 0, lng: 0},
          status: data.status || 'inactive',
          coLevel: data.coLevel || 0,
          timestamp: timestampStr,
          historicalData: data.historicalData || [],
        } as Device);
      });
      
      devicesData.sort((a, b) => a.name.localeCompare(b.name));
      setDevices(devicesData);
      setLoading(false);
      setError(null);
      checkForAnomalies(devicesData);
    }, (err) => {
      console.error("Failed to fetch devices from Firestore:", err);
      setError("Failed to load device data. Please check your connection and Firebase setup.");
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  async function checkForAnomalies(newDevices: Device[]) {
    for (const device of newDevices) {
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
              message: result.explanation,
              timestamp: latestReading.timestamp,
              severity: 'Warning', 
            };
            
            setAlerts(prevAlerts => {
              const alertExists = prevAlerts.some(a => a.id === anomalyAlert.id);
              if (!alertExists) {
                toast({
                  title: `AI Anomaly Detected: ${device.name}`,
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
    if (devices.length > 0) {
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
        const alertIds = new Set(prevAlerts.map(a => a.id));
        const newStatusAlerts = statusAlerts.filter(a => !alertIds.has(a.id));
        
        const allAlerts = [...newStatusAlerts, ...prevAlerts]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 20);

        return allAlerts;
      });
    }
  }, [devices]);

  const criticalAlertsCount = alerts.filter(a => a.severity === 'Critical').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Displaying live data from your Raspberry Pi via Firestore.
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
        <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
                <TabsTrigger value="devices">Devices</TabsTrigger>
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
            <TabsContent value="map">
                <MapView devices={devices}/>
            </TabsContent>
            <TabsContent value="devices">
                <DevicesTable devices={devices} />
            </TabsContent>
        </Tabs>
      ) : !error && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No devices found in Firestore. Waiting for sensor data...</p>
        </div>
      )}
    </div>
  );
}
