'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, updateDoc, getDoc } from 'firebase/firestore';
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
    
    let historicalData = [];
    if (deviceSnap.exists()) {
        historicalData = deviceSnap.data().historicalData || [];
    }
    
    historicalData = [...historicalData.slice(1), { coLevel: data.coLevel, timestamp: now }];


    const devicePayload = {
      id: data.id,
      name: data.name,
      location: data.location.name,
      coords: { lat: data.location.lat, lng: data.location.lng },
      status: data.status,
      coLevel: data.coLevel,
      timestamp: now,
      historicalData: historicalData,
    };

    await setDoc(deviceRef, devicePayload, { merge: true });

    console.log(`Upserted device: ${data.id}`);
    
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
  try {
    const querySnapshot = await getDocs(devicesCollection);
    const devices = querySnapshot.docs.map(doc => doc.data() as Device);
    return NextResponse.json(devices);
  } catch (error) {
     console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
