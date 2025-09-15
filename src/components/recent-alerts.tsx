'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Alert } from '@/lib/types';
import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from './ui/badge';

interface RecentAlertsProps {
  alerts: Alert[];
}

export function RecentAlerts({ alerts }: RecentAlertsProps) {
    const getIcon = (severity: Alert['severity']) => {
        switch (severity) {
            case 'Critical':
                return <ShieldAlert className="h-5 w-5 text-destructive" />;
            case 'Warning':
                return <ShieldAlert className="h-5 w-5 text-yellow-500" />;
            default:
                return <ShieldQuestion className="h-5 w-5 text-muted-foreground" />;
        }
    }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
        <CardDescription>
          You have {alerts.length} new alerts in the last hour.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 text-center h-48">
                <ShieldCheck className="h-12 w-12 text-primary"/>
                <p className="text-lg font-semibold">All Systems Normal</p>
                <p className="text-sm text-muted-foreground">No new alerts to show right now.</p>
            </div>
        ) : alerts.slice(0, 5).map((alert) => (
          <div key={alert.id} className="flex items-center space-x-4">
            <div className="flex-shrink-0">
                {getIcon(alert.severity)}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                {alert.deviceName}
              </p>
              <p className="text-sm text-muted-foreground">{alert.message}</p>
            </div>
            <div className="flex flex-col items-end text-sm text-muted-foreground">
                <Badge variant={alert.severity === 'Critical' ? 'destructive' : 'secondary'}>{alert.severity}</Badge>
                <span>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
