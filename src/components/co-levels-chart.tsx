
'use client';

import { useMemo, useState } from 'react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Device } from '@/lib/types';
import { format, sub } from 'date-fns';

interface COLevelsChartProps {
  devices: Device[];
}

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

const generateFakeData = (devices: Device[]) => {
  const now = new Date();
  const dataPoints = 20;
  return devices.map(device => {
    const historicalData = [];
    let coLevel = Math.random() * 10;
    for (let i = dataPoints -1; i >= 0; i--) {
      const timestamp = sub(now, { hours: i }).toISOString();
      coLevel += (Math.random() - 0.5) * 2;
      if (coLevel < 0) coLevel = 0;
      historicalData.push({ coLevel: parseFloat(coLevel.toFixed(2)), timestamp });
    }
    return {
      ...device,
      historicalData,
    };
  })
};

export function COLevelsChart({ devices }: COLevelsChartProps) {
  const [timePeriod, setTimePeriod] = useState('24h');

  const filteredDevices = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (timePeriod) {
      case '1h':
        cutoffDate = sub(now, { hours: 1 });
        break;
      case '6h':
        cutoffDate = sub(now, { hours: 6 });
        break;
      case '24h':
      default:
        cutoffDate = sub(now, { hours: 24 });
        break;
    }

    if (!devices) return [];

    return devices.map(device => ({
      ...device,
      historicalData: device.historicalData.filter(d => new Date(d.timestamp) >= cutoffDate),
    }));
  }, [devices, timePeriod]);
  
  const hasData = useMemo(() => {
    return filteredDevices.some(d => d.historicalData.length > 0);
  }, [filteredDevices]);
  
  const chartDevices = hasData ? filteredDevices : generateFakeData(devices);


  if (!devices || devices.length === 0) {
    return (
      <Card className="bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle>CO Level Monitoring</CardTitle>
          <CardDescription>Awaiting data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No device data available to display chart.</p>
        </CardContent>
      </Card>
    );
  }

  const legendFormatter = (value: string) => {
    const device = devices.find(d => d.name === value);
    if (device) {
      return `${device.name} (${device.coLevel.toFixed(2)} PPM)`;
    }
    return value;
  };

  const timeFormatter = (tick: number | string) => {
    if (typeof tick === 'string') {
      return format(new Date(tick), 'HH:mm');
    }
    return format(new Date(tick), 'HH:mm');
  };

  return (
    <Card className="bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-2">
            <div>
                <CardTitle>Live CO Level Monitoring</CardTitle>
                <CardDescription>
                  {hasData ? 'Real-time CO levels (ppm) for all devices.' : 'Real-time CO levels (ppm) for all devices. (Showing sample data)'}
                </CardDescription>
            </div>
            <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="6h">Last 6 Hours</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              margin={{
                top: 5,
                right: 20,
                left: -10,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                scale="time"
                tickFormatter={timeFormatter}
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
                domain={[0, 'dataMax + 5']}
              />
              <Tooltip
                labelFormatter={(label) => format(new Date(label), 'PPP p')}
                formatter={(value: number, name: string) => [`${value.toFixed(2)} ppm`, name]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                }}
              />
              <Legend iconSize={14} formatter={legendFormatter} />
              {chartDevices.map((device, index) => (
                <Line
                  key={device.id}
                  data={device.historicalData.map(h => ({ ...h, timestamp: new Date(h.timestamp).getTime() }))}
                  type="monotone"
                  name={device.name}
                  dataKey="coLevel"
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 8 }}
                  connectNulls={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
