
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OverviewCards } from '@/components/overview-cards';
import { COLevelsChart } from '@/components/co-levels-chart';
import { DeviceStatusPieChart } from '@/components/device-status-pie-chart';
import { RecentAlerts } from '@/components/recent-alerts';
import { DevicesTable } from '@/components/devices-table';
import { DeviceDetailsCard } from '@/components/device-details-card';
import { MapView } from '@/components/map-view';
import { AlertsTable } from '@/components/alerts-table';
import type { Device, Alert } from '@/lib/types';

export function DashboardTabs({ devices, alerts, onSelectDevice, selectedDevice }: { devices: Device[], alerts: Alert[], onSelectDevice: (device: Device | null) => void, selectedDevice: Device | null }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (value: string) => {
    router.push(`/dashboard?tab=${value}`);
  };

  return (
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
            <DevicesTable devices={devices} onSelectDevice={onSelectDevice} selectedDevice={selectedDevice} />
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
        <AlertsTable alerts={alerts}/>
      </TabsContent>
    </Tabs>
  );
}
