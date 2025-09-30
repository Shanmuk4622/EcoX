
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PpmChart from "./ppm-chart";
import { Device } from "@/lib/types";
import { Badge } from "./ui/badge";

interface DeviceDetailsCardProps {
  device: Device | null;
}

export function DeviceDetailsCard({ device }: DeviceDetailsCardProps) {
  if (!device) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Details</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[500px]">
          <p className="text-muted-foreground">Select a device from the list to see its details and historical data.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusVariant = (status: Device['status']) => {
    switch (status) {
      case 'Critical':
        return 'destructive';
      case 'Warning':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{device.name}</CardTitle>
                <CardDescription>{device.location}</CardDescription>
            </div>
            <Badge variant={getStatusVariant(device.status)} className="capitalize">{device.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Real-time CO Level</h3>
            <p className="text-2xl font-bold">{device.coLevel.toFixed(2)} PPM</p>
            <p className="text-xs text-muted-foreground">Last updated: {new Date(device.timestamp).toLocaleString()}</p>
        </div>
        <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Historical Data (last 20 readings)</h3>
            <div className="h-[300px] w-full">
                <PpmChart device={device} />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
