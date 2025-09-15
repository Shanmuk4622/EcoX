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

const alerts = [
  {
    id: 'ALERT001',
    deviceId: 'DEV002',
    deviceName: 'Industrial Park Unit 7',
    message: 'Sudden spike in CO levels detected, exceeding safety thresholds.',
    timestamp: new Date().toISOString(),
    severity: 'Critical',
  },
  {
    id: 'ALERT002',
    deviceId: 'DEV004',
    deviceName: 'Central Station Platform 3',
    message: 'CO levels consistently above average for this time of day.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    severity: 'Warning',
  },
];

export default function AlertsPage() {
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
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  <Badge
                    variant={alert.severity === 'Critical' ? 'destructive' : 'secondary'}
                    className={alert.severity === 'Warning' ? 'bg-yellow-100 text-yellow-800' : ''}
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    {alert.severity}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{alert.deviceName}</TableCell>
                <TableCell>{alert.message}</TableCell>
                <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
              </TableRow>
            ))}
             {alerts.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No alerts to display.
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
