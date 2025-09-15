'use client';
import { useState } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { initialDevices } from '@/lib/data';
import type { Device } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Badge } from './ui/badge';

export function MapView() {
  const [devices] = useState<Device[]>(initialDevices);
  const mapImage = PlaceHolderImages.find((img) => img.id === 'map-background');

  // Normalize coordinates to fit within a 0-1 range for positioning
  const lats = devices.map((d) => d.coords.lat);
  const lngs = devices.map((d) => d.coords.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const getPinColor = (status: Device['status']) => {
    switch (status) {
      case 'Normal':
        return 'bg-primary';
      case 'Warning':
        return 'bg-yellow-500';
      case 'Critical':
        return 'bg-destructive';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-4">
       <div>
          <h2 className="text-2xl font-bold tracking-tight">Live Device Map</h2>
          <p className="text-muted-foreground">
            Geographical overview of your sensor network.
          </p>
        </div>
      <div className="relative w-full overflow-hidden rounded-lg border aspect-[16/9]">
        {mapImage && (
          <Image
            src={mapImage.imageUrl}
            alt={mapImage.description}
            data-ai-hint={mapImage.imageHint}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/10"></div>
        {devices.map((device) => {
          const top =
            100 - ((device.coords.lat - minLat) / (maxLat - minLat)) * 100;
          const left =
            ((device.coords.lng - minLng) / (maxLng - minLng)) * 100;

          return (
            <Popover key={device.id}>
              <PopoverTrigger asChild>
                <button
                  className="absolute -translate-x-1/2 -translate-y-1/2 transform"
                  style={{ top: `${top}%`, left: `${left}%` }}
                >
                  <span
                    className={cn(
                      'relative flex h-3 w-3 rounded-full',
                      getPinColor(device.status)
                    )}
                  >
                    {device.status !== 'Normal' && (
                       <span
                        className={cn(
                          'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                          getPinColor(device.status)
                        )}
                      ></span>
                    )}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                        <h4 className="font-medium leading-none">{device.name}</h4>
                        <Badge variant={device.status === 'Critical' ? 'destructive' : 'secondary'}>{device.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {device.location}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-2 items-center">
                      <span className="text-sm font-medium">CO Level</span>
                      <span className="text-right">{device.coLevel.toFixed(2)} ppm</span>
                    </div>
                     <div className="grid grid-cols-2 items-center">
                      <span className="text-sm font-medium">Last Update</span>
                      <span className="text-right text-sm text-muted-foreground">
                        {format(new Date(device.timestamp), 'p, dd/MM/yy')}
                      </span>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    </div>
  );
}
