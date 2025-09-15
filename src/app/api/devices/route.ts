// Location: src/app/api/devices/route.ts
'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';
// CORRECTED: Use the admin SDK for server-side operations
import { adminDb } from '@/lib/firebase';
import type { Device } from '@/lib/types';

// Zod schema for validating incoming device data
const deviceDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.object({ lat: z.number(), lng: z.number(), name: z.string() }),
  status: z.enum(['Normal', 'Warning', 'Critical']),
  coLevel: z.number(),
  battery: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = deviceDataSchema.parse(json);
    
    // Reference the document in the 'devices' collection
    const deviceRef = adminDb.collection('devices').doc(data.id);
    const now = new Date();
    const newReading = { coLevel: data.coLevel, timestamp: now.toISOString() };

    const deviceSnap = await deviceRef.get();

    if (deviceSnap.exists) {
      // --- Device EXISTS, UPDATE it ---
      const existingData = deviceSnap.data() || {};
      // Get existing historical data or start with an empty array
      const historicalData = (existingData.historicalData || []).slice(0, 19);

      await deviceRef.update({
        status: data.status,
        coLevel: data.coLevel,
        timestamp: now.toISOString(),
        name: data.name,
        location: data.location.name, // Keep location as a simple string
        coords: { lat: data.location.lat, lng: data.location.lng },
        historicalData: [newReading, ...historicalData],
      });
      console.log(`Successfully updated device: ${data.id}`);

    } else {
      // --- Device is NEW, CREATE it ---
      await deviceRef.set({
        id: data.id,
        name: data.name,
        location: data.location.name,
        coords: { lat: data.location.lat, lng: data.location.lng },
        status: data.status,
        coLevel: data.coLevel,
        timestamp: now.toISOString(),
        historicalData: [newReading], // Start with the first reading
      });
      console.log(`Successfully created new device: ${data.id}`);
    }

    return NextResponse.json({ message: 'Data received successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[API VALIDATION ERROR]', error.errors);
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }
    
    console.error('[API SERVER ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET function to retrieve all devices
export async function GET() {
    try {
        const snapshot = await adminDb.collection('devices').get();
        if (snapshot.empty) {
            console.log('No devices found in Firestore.');
            return NextResponse.json([]);
        }
        const devices = snapshot.docs.map(doc => doc.data() as Device);
        return NextResponse.json(devices);
    } catch (error) {
        console.error('[API GET ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
