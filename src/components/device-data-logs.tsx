
'use client';

import { format } from 'date-fns';
import { Device } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DeviceDataLogsProps {
  data: Device['historicalData'];
}

export function DeviceDataLogs({ data }: DeviceDataLogsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border h-48">
        <p className="text-muted-foreground">No data logs available.</p>
      </div>
    );
  }

  // Sort data with newest entries first for log view
  const sortedData = [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <ScrollArea className="h-[300px] w-full rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>CO Level (ppm)</TableHead>
            <TableHead className="text-right">Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((log, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{log.coLevel.toFixed(2)}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {format(new Date(log.timestamp), 'Pp')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
