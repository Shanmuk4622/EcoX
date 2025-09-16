
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ResponsiveContainer } from 'recharts';
import { Device } from '@/lib/types';
import { format } from 'date-fns';

interface PpmChartProps {
  device: Device | null;
}

export default function PpmChart({ device }: PpmChartProps) {
  if (!device || !device.historicalData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select a device to view its historical data</p>
      </div>
    );
  }

  const chartData = [...device.historicalData]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((d) => ({
      ...d,
      time: format(new Date(d.timestamp), 'HH:mm:ss'),
    }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
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
        />
        <Tooltip
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
            }}
        />
        <Legend />
        <Line type="monotone" dataKey="coLevel" stroke="hsl(var(--primary))" name="CO Level (ppm)" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
