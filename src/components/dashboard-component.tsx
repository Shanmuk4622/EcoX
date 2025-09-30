'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
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
    if (coLevel >= 300) {
      return 'Critical';
    }
    if (coLevel >= 100) {
      return 'Warning';
    }
    return 'Normal';
  }, []);

  useEffect(() => {
    if (!db) {
      setError("Firestore is not configured. Please add your Firebase project configuration to your environment variables.");
      setLoading(false);
      return;
    }

    const devicesQuery = query(collection(db, 'devices'));
    const unsubscribeDevices = onSnapshot(devicesQuery, (snapshot) => {
      const staticDevicesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              name: data.name || 'Unknown Device',
              location: data.location?.name || 'Unknown Location',
              coords: { lat: data.location?.lat || 0, lng: data.location?.lng || 0 },
          };
      });

      const readingsQuery = query(collection(db, 'readings'));
      const unsubscribeReadings = onSnapshot(readingsQuery, (readingsSnapshot) => {
        const readingsByDevice: { [key: string]: { coLevel: number, timestamp: string }[] } = {};

        readingsSnapshot.forEach((doc) => {
          const reading = doc.data();
          const deviceId = reading.deviceId;
          if (!deviceId) return;

          if (!readingsByDevice[deviceId]) {
            readingsByDevice[deviceId] = [];
          }
          
          let timestampStr: string;
          if (reading.timestamp instanceof Timestamp) {
            timestampStr = reading.timestamp.toDate().toISOString();
          } else if (typeof reading.timestamp === 'string') {
            timestampStr = reading.timestamp;
          } else {
            timestampStr = new Date().toISOString();
          }

          readingsByDevice[deviceId].push({
            coLevel: reading.coLevel,
            timestamp: timestampStr,
          });
        });
        
        const updatedDevices: Device[] = staticDevicesData.map(staticDevice => {
          const deviceReadings = readingsByDevice[staticDevice.id] || [];
          deviceReadings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          const latestReading = deviceReadings[0] || { coLevel: 0, timestamp: new Date().toISOString() };

          return {
            ...staticDevice,
            coLevel: latestReading.coLevel,
            timestamp: latestReading.timestamp,
            status: getDeviceStatus(latestReading.coLevel),
            historicalData: deviceReadings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).slice(-20),
          };
        });

        const sortedDevices = updatedDevices.sort((a, b) => a.name.localeCompare(b.name));
        
        sortedDevices.forEach(newDevice => {
            const oldDevice = devices.find(d => d.id === newDevice.id);
            if (oldDevice && oldDevice.status !== newDevice.status) {
              if (newDevice.status === 'Warning') {
                playBeep(2);
              }
            }
        });

        if (sortedDevices.length > 0 && !selectedDevice) {
            setSelectedDevice(sortedDevices[0]);
        } else if (selectedDevice) {
            const updatedSelected = sortedDevices.find(d => d.id === selectedDevice.id);
            if (updatedSelected) {
              setSelectedDevice(updatedSelected);
            }
        }
        
        setDevices(sortedDevices);
        setLoading(false);
        setError(null);
      }, (err) => {
        console.error("Failed to fetch readings from Firestore:", err);
        setError("Failed to load readings data.");
        setLoading(false);
      });
      
      return () => unsubscribeReadings();
      
    }, (err) => {
        console.error("Failed to fetch devices from Firestore:", err);
        setError("Failed to load device data. Please check your connection and Firebase setup.");
        setLoading(false);
    });

    return () => unsubscribeDevices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const isAnyDeviceCritical = devices.some(d => d.status === 'Critical');
    const areAllDevicesNormal = devices.every(d => d.coLevel < 100);

    if (isAnyDeviceCritical) {
      if (!isPlaying) {
        startContinuousBeep();
      }
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
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Displaying live data from your sensors via Firestore.
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
