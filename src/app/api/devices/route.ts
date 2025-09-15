'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, getDoc, updateDoc } from 'firebase/firestore';
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
    const deviceSnap = await getDoc(deviceRef);

    const now = new Date().toISOString();
    const newReading = { coLevel: data.coLevel, timestamp: now };

    if (deviceSnap.exists()) {
      // Device exists, update it
      const existingData = deviceSnap.data();
      const historicalData = (existingData.historicalData || []).slice(-19); // Keep last 19 + the new one
      
      const updatedPayload = {
        name: data.name,
        location: data.location.name,
        coords: { lat: data.location.lat, lng: data.location.lng },
        status: data.status,
        coLevel: data.coLevel,
        timestamp: now,
        historicalData: [...historicalData, newReading],
      };
      
      await updateDoc(deviceRef, updatedPayload);
      console.log(`Updated device: ${data.id}`);

    } else {
      // Device does not exist, create it
      const newDevicePayload = {
        id: data.id,
        name: data.name,
        location: data.location.name,
        coords: { lat: data.location.lat, lng: data.location.lng },
        status: data.status,
        coLevel: data.coLevel,
        timestamp: now,
        historicalData: [newReading], // Start with the first reading
      };
      await setDoc(deviceRef, newDevicePayload);
      console.log(`Created new device: ${data.id}`);
    }
    
    return NextResponse.json({ message: 'Data received successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod Error:', error.errors);
      return NextResponse.json({ error: 'Invalid data format', details: error.errors }, { status: 400 });
    }
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
