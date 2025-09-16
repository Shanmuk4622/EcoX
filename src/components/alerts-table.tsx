
'use client';

import { useMemo, useState } from 'react';
import { Alert } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';

export function AlertsTable({ alerts }: { alerts: Alert[] }) {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') || 'all');
  const [sort, setSort] = useState('timestamp-desc');

  const filteredAndSortedAlerts = useMemo(() => {
    let filtered = alerts;

    if (filter) {
      filtered = filtered.filter(
        (alert) =>
          alert.deviceName.toLowerCase().includes(filter.toLowerCase()) ||
          alert.message.toLowerCase().includes(filter.toLowerCase())
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter((alert) => alert.severity === severityFilter);
    }

    const [sortKey, sortDirection] = sort.split('-');
    return [...filtered].sort((a, b) => {
      let compareA = a[sortKey as keyof Alert];
      let compareB = b[sortKey as keyof Alert];

      if (sortKey === 'timestamp') {
        compareA = new Date(compareA as string).getTime();
        compareB = new Date(compareB as string).getTime();
      }

      if (sortDirection === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });
  }, [alerts, filter, severityFilter, sort]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter alerts..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="Warning">Warning</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="timestamp-desc">Newest First</SelectItem>
            <SelectItem value="timestamp-asc">Oldest First</SelectItem>
            <SelectItem value="severity-desc">Severity (High to Low)</SelectItem>
            <SelectItem value="severity-asc">Severity (Low to High)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedAlerts.length > 0 ? (
              filteredAndSortedAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>{alert.deviceName}</TableCell>
                  <TableCell>{alert.message}</TableCell>
                  <TableCell>
                    <Badge variant={alert.severity === 'Critical' ? 'destructive' : 'warning'}>
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(alert.timestamp), 'PPP p')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
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
