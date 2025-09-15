'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, getDocs } from 'firebase/firestore';
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
    const now = new Date().toISOString();
    const newReading = { coLevel: data.coLevel, timestamp: now };

    const deviceSnap = await getDoc(deviceRef);

    if (deviceSnap.exists()) {
      // Device exists, update it
      const existingData = deviceSnap.data();
      const historicalData = (existingData.historicalData || []).slice(-19); // Keep last 20 readings

      await updateDoc(deviceRef, {
        status: data.status,
        coLevel: data.coLevel,
        timestamp: now,
        historicalData: [...historicalData, newReading],
        name: data.name,
        location: data.location.name,
        coords: { lat: data.location.lat, lng: data.location.lng },
      });

    } else {
      // Device is new, create it
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
      await setDoc(deviceRef, newDeviceData);
    }

    return NextResponse.json({ message: 'Data received successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod Validation Error:', error.errors);
      return NextResponse.json({ error: 'Invalid data format', details: error.errors }, { status: 400 });
    }
    
    console.error('API Error in POST /api/devices:', error);
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
     console.error('API Error in GET /api/devices:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
