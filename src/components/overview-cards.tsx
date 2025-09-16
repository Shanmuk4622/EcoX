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
  
  const normalPercentage = totalDevices > 0 ? Math.round((normalDevices / totalDevices) * 100) : 0;


  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Devices</CardTitle>
          <Router className="h-4 w-4 text-blue-600 dark:text-blue-300" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalDevices}</div>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            All registered sensor units
          </p>
        </CardContent>
      </Card>
      <Card className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Critical Alerts</CardTitle>
          <ShieldAlert className="h-4 w-4 text-red-500 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-300">{criticalAlerts}</div>
          <p className="text-xs text-red-700 dark:text-red-400">
            Immediate attention required
          </p>
        </CardContent>
      </Card>
      <Card className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">System Status</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-300" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {normalPercentage}% Normal
          </div>
          <p className="text-xs text-green-700 dark:text-green-300">
            Percentage of devices operating normally
          </p>
        </CardContent>
      </Card>
      <Card className="bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">Total Alerts Today</CardTitle>
          <Bell className="h-4 w-4 text-amber-600 dark:text-amber-300" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">+{alerts.length}</div>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            In the last 24 hours
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
