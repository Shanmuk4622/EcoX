'use client';
import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert } from 'lucide-react';
import type { Alert, Device } from '@/lib/types';
import { format } from 'date-fns';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    async function fetchDeviceData() {
      try {
        const response = await fetch('/api/devices');
        const devices: Device[] = await response.json();
        
        const generatedAlerts = devices
          .filter(d => d.status === 'Critical' || d.status === 'Warning')
          .map(d => ({
            id: `alert-${d.id}-${d.timestamp}`,
            deviceId: d.id,
            deviceName: d.name,
            message: `${d.status} CO level of ${d.coLevel.toFixed(2)} ppm detected.`,
            timestamp: d.timestamp,
            severity: d.status as 'Critical' | 'Warning'
          }))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setAlerts(generatedAlerts);
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      }
    }

    fetchDeviceData();
    const intervalId = setInterval(fetchDeviceData, 5000); // Refresh every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Alerts</h2>
          <p className="text-muted-foreground">
            A log of all warnings and critical alerts from your devices.
          </p>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Severity</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.length > 0 ? alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  <Badge
                    variant={alert.severity === 'Critical' ? 'destructive' : 'secondary'}
                     className={alert.severity === 'Warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : ''}
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    {alert.severity}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{alert.deviceName}</TableCell>
                <TableCell>{alert.message}</TableCell>
                <TableCell>{format(new Date(alert.timestamp), 'PPpp')}</TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No alerts to display. All systems normal.
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
