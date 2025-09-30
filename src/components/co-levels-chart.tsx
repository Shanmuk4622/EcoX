'use client';

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
import type { Device } from '@/lib/types';
import { format } from 'date-fns';

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

export function COLevelsChart({ devices }: COLevelsChartProps) {
    if (!devices || devices.length === 0) {
        return (
            <Card className="bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800">
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
    
    // Combine all historical data and get the unique timestamps
    const allData = devices.flatMap(d => d.historicalData || []);
    const timeDomain = [
        Math.min(...allData.map(d => new Date(d.timestamp).getTime())),
        Math.max(...allData.map(d => new Date(d.timestamp).getTime()))
    ];
    
    const legendFormatter = (value: string) => {
        const device = devices.find(d => d.name === value);
        if (device) {
          return `${device.name} (${device.coLevel.toFixed(2)} PPM)`;
        }
        return value;
    };
    
    const timeFormatter = (tick: number) => {
        return format(new Date(tick), 'HH:mm:ss');
    }

  return (
    <Card className="bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle>Live CO Level Monitoring</CardTitle>
        <CardDescription>
          Real-time CO levels (ppm) for all devices.
        </CardDescription>
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
                dataKey={(payload) => new Date(payload.timestamp).getTime()}
                type="number"
                domain={timeDomain}
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
                labelFormatter={timeFormatter}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                }}
              />
              <Legend iconSize={14} formatter={legendFormatter} />
              {devices.map((device, index) => (
                <Line
                    key={device.id}
                    data={device.historicalData}
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
