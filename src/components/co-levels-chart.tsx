
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
    
    const chartData = devices.flatMap(device => 
        device.historicalData.map(d => ({
            time: new Date(d.timestamp).getTime(),
            [device.name]: d.coLevel
        }))
    );

    // This is a bit tricky. We need to merge all data points by time.
    const mergedData = chartData.reduce((acc, curr) => {
        const time = new Date(curr.time).toLocaleTimeString();
        let existing = acc.find(item => item.time === time);
        if (existing) {
            Object.assign(existing, curr);
        } else {
            acc.push({ ...curr, time });
        }
        return acc;
    }, [] as any[]).sort((a,b) => new Date('1970-01-01 ' + a.time).getTime() - new Date('1970-01-01 ' + b.time).getTime());

    const allHistoricalData = devices.flatMap(d => d.historicalData.map(h => ({ deviceId: d.id, ...h, time: new Date(h.timestamp).getTime() }))).sort((a, b) => a.time - b.time);
    
    const dataForChart = allHistoricalData.reduce((acc: {[key:string]: any}[], reading) => {
        const timeStr = format(new Date(reading.time), 'HH:mm:ss');
        let timeEntry = acc.find(e => e.time === timeStr);
        if (!timeEntry) {
            timeEntry = { time: timeStr };
            acc.push(timeEntry);
        }
        const device = devices.find(d => d.id === reading.deviceId);
        if (device) {
            timeEntry[device.name] = reading.coLevel;
        }
        return acc;
    }, []);

    const legendFormatter = (value: string) => {
        const device = devices.find(d => d.name === value);
        if (device) {
          return `${device.name} (${device.coLevel.toFixed(2)} PPM)`;
        }
        return value;
      };


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
              data={dataForChart}
              margin={{
                top: 5,
                right: 20,
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
                domain={[0, 'dataMax + 5']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                }}
              />
              <Legend iconSize={14} formatter={legendFormatter} />
              {devices.map((device, index) => (
                <Line
                    key={device.id}
                    type="monotone"
                    dataKey={device.name}
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
