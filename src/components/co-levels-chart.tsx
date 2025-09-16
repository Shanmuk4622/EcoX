
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
    if (!devices || devices.length === 0 || devices.every(d => !d.historicalData || d.historicalData.length === 0)) {
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
    
    // Combine historical data from all devices, making sure it's sorted
    const allReadings = devices.flatMap(d => 
        (d.historicalData || []).map(h => ({
            ...h,
            deviceId: d.id,
            deviceName: d.name,
            time: new Date(h.timestamp).getTime()
        }))
    ).sort((a,b) => a.time - b.time);

    // Get unique timestamps from all readings
    const uniqueTimestamps = [...new Set(allReadings.map(r => r.time))];

    // Create the data structure for the chart
    const chartData = uniqueTimestamps.map(time => {
        const record: {[key: string]: any} = { time: format(new Date(time), 'HH:mm:ss') };
        devices.forEach(device => {
            // Find the reading for this device at this specific time
            const reading = allReadings.find(r => r.deviceId === device.id && r.time === time);
            // If a reading exists, use its coLevel. Otherwise, it's null.
            record[device.name] = reading ? reading.coLevel : null;
        });
        return record;
    });


  return (
    <Card>
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
              data={chartData}
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
              <Legend />
              {devices.map((device, index) => (
                <Line
                    key={device.id}
                    type="monotone"
                    dataKey={device.name}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                    connectNulls={true} // This will connect lines over missing data points
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
