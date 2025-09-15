'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, runTransaction } from 'firebase/firestore';
import type { Device } from '@/lib/types';

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

const devicesCollection = collection(firestore, 'devices');

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = deviceDataSchema.parse(json);
    const deviceRef = doc(firestore, 'devices', data.id);

    await runTransaction(firestore, async (transaction) => {
      const deviceSnap = await transaction.get(deviceRef);
      const now = new Date().toISOString();
      const newReading = { coLevel: data.coLevel, timestamp: now };

      if (!deviceSnap.exists()) {
        // Device is new, create it with initial data
        const newDeviceData = {
          id: data.id,
          name: data.name,
          location: data.location.name,
          coords: { lat: data.location.lat, lng: data.location.lng },
          status: data.status,
          coLevel: data.coLevel,
          timestamp: now,
          historicalData: [newReading],
        };
        transaction.set(deviceRef, newDeviceData);
      } else {
        // Device exists, update it
        const existingData = deviceSnap.data();
        const historicalData = (existingData.historicalData || []).slice(-19); // Keep last 20 readings
        
        const updatedData = {
          status: data.status,
          coLevel: data.coLevel,
          timestamp: now,
          historicalData: [...historicalData, newReading],
          // Also update these in case they change
          name: data.name,
          location: data.location.name,
          coords: { lat: data.location.lat, lng: data.location.lng },
        };
        transaction.update(deviceRef, updatedData);
      }
    });

    return NextResponse.json({ message: 'Data received successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data format', details: error.errors }, { status: 400 });
    }
    console.error('API Error:', error);
    // Ensure a generic but clear error is sent to the client
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  try {
    const querySnapshot = await getDocs(devicesCollection);
    const devices = querySnapshot.docs.map(doc => doc.data() as Device);
    return NextResponse.json(devices);
  } catch (error) {
     console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
