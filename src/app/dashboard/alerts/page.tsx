
'use client';
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
import type { Alert } from '@/lib/types';
import { format } from 'date-fns';

export default function AlertsPage({ alerts }: { alerts: Alert[] }) {
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
            {alerts && alerts.length > 0 ? alerts.map((alert) => (
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
