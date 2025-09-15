'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Device, Alert } from '@/lib/types';
import { Bell, CheckCircle, Router, ShieldAlert } from 'lucide-react';

interface OverviewCardsProps {
  devices: Device[];
  alerts: Alert[];
}

export function OverviewCards({ devices, alerts }: OverviewCardsProps) {
  const totalDevices = devices.length;
  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === 'Critical'
  ).length;
  const normalDevices = devices.filter(
    (device) => device.status === 'Normal'
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          <Router className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDevices}</div>
          <p className="text-xs text-muted-foreground">
            All registered sensor units
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
          <ShieldAlert className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{criticalAlerts}</div>
          <p className="text-xs text-muted-foreground">
            Immediate attention required
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          <CheckCircle className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round((normalDevices / totalDevices) * 100)}% Normal
          </div>
          <p className="text-xs text-muted-foreground">
            Percentage of devices operating normally
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Alerts Today</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{alerts.length}</div>
          <p className="text-xs text-muted-foreground">
            In the last 24 hours
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
