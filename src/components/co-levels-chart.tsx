'use client';

import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Device } from '@/lib/types';
import { format } from 'date-fns';

interface COLevelsChartProps {
  devices: Device[];
}

export function COLevelsChart({ devices }: COLevelsChartProps) {
  // For simplicity, we'll show data for the first device
  const device = devices[0];
  
  if (!device) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>CO Level Monitoring</CardTitle>
                <CardDescription>
                Awaiting data...
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No device data available to display chart.</p>
            </CardContent>
        </Card>
    );
  }

  const chartData = device.historicalData.map((d) => ({
    ...d,
    time: format(new Date(d.timestamp), 'HH:mm'),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>CO Level Monitoring</CardTitle>
        <CardDescription>
          Live CO levels (ppm) for device: {device.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: -10,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 'dataMax + 10']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                }}
              />
              <Line
                type="monotone"
                dataKey="coLevel"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
