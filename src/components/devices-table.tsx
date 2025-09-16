
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
import type { Device } from '@/lib/types';
import clsx from 'clsx';

interface DevicesTableProps {
  devices: Device[];
  onSelectDevice: (device: Device) => void;
  selectedDevice: Device | null;
}

export function DevicesTable({ devices, onSelectDevice, selectedDevice }: DevicesTableProps) {
  const getStatusBadge = (status: Device['status']) => {
    switch (status) {
      case 'Normal':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Normal</Badge>;
      case 'Warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">Warning</Badge>;
      case 'Critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>CO Level</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <TableRow
              key={device.id}
              onClick={() => onSelectDevice(device)}
              className={clsx(
                'cursor-pointer',
                selectedDevice?.id === device.id && 'bg-muted/50'
              )}
            >
              <TableCell>
                <div className="font-medium">{device.name}</div>
                <div className="text-xs text-muted-foreground">{device.id}</div>
              </TableCell>
              <TableCell>
                {device.coLevel.toFixed(2)} ppm
              </TableCell>
              <TableCell className="text-right">{getStatusBadge(device.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
