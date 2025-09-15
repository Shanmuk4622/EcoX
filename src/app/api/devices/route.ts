'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { initialDevices } from '@/lib/data'; // We'll use this to "store" data in memory for now

const deviceDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    name: z.string(),
  }),
  status: z.enum(['Normal', 'Warning', 'Critical']),
  coLevel: z.number(),
  battery: z.number().optional(),
});

// This is a simple in-memory store. Data will reset on server restart.
// In a real application, you would save this to a database like Firestore.
let devices = [...initialDevices];

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = deviceDataSchema.parse(json);

    const deviceIndex = devices.findIndex(d => d.id === data.id);

    const now = new Date().toISOString();

    if (deviceIndex !== -1) {
      // Update existing device
      devices[deviceIndex] = {
        ...devices[deviceIndex],
        name: data.name,
        location: data.location.name,
        coords: { lat: data.location.lat, lng: data.location.lng },
        status: data.status,
        coLevel: data.coLevel,
        timestamp: now,
        // Add to historical data, keeping the array size limited
        historicalData: [...devices[deviceIndex].historicalData.slice(1), { coLevel: data.coLevel, timestamp: now }],
      };
      console.log(`Updated device: ${data.id}`);
    } else {
      // Add new device
      devices.push({
        id: data.id,
        name: data.name,
        location: data.location.name,
        coords: { lat: data.location.lat, lng: data.location.lng },
        status: data.status,
        coLevel: data.coLevel,
        timestamp: now,
        // Generate some fake historical data for a new device
        historicalData: Array(20).fill(0).map((_, i) => ({
            coLevel: data.coLevel,
            timestamp: new Date(Date.now() - (20 - i) * 60000).toISOString()
        }))
      });
      console.log(`Added new device: ${data.id}`);
    }

    return NextResponse.json({ message: 'Data received successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data format', details: error.errors }, { status: 400 });
    }
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  // This allows the dashboard to fetch the latest device data
  return NextResponse.json(devices);
}
