
// Location: src/app/api/devices/route.ts
'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase';
import type { Device } from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';

const deviceDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.object({ lat: z.number(), lng: z.number(), name: z.string() }),
  status: z.enum(['Normal', 'Warning', 'Critical']),
  coLevel: z.number(),
  battery: z.number().optional(),
});

export async function POST(request: Request) {
  if (!adminDb) {
      console.error('[API POST ERROR] Firestore is not initialized.');
      return NextResponse.json({ error: 'Firestore not initialized' }, { status: 500 });
  }
  
  try {
    const json = await request.json();
    const data = deviceDataSchema.parse(json);
    
    const deviceRef = adminDb.collection('devices').doc(data.id);
    const now = new Date();
    const newReading = { coLevel: data.coLevel, timestamp: now.toISOString() };

    const deviceSnap = await deviceRef.get();

    if (!deviceSnap.exists) {
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
    } else {
      // --- Device EXISTS, UPDATE it ---
      const existingData = deviceSnap.data() || {};
      const historicalData = (existingData.historicalData || []).slice(0, 19);

      await deviceRef.update({
        status: data.status,
        coLevel: data.coLevel,
        timestamp: now.toISOString(),
        name: data.name,
        location: data.location.name,
        coords: { lat: data.location.lat, lng: data.location.lng },
        historicalData: [newReading, ...historicalData],
      });
      console.log(`Successfully updated device: ${data.id}`);
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

export async function GET() {
    if (!adminDb) {
        console.error('[API GET ERROR] Firestore is not initialized.');
        return NextResponse.json({ error: 'Firestore not initialized' }, { status: 500 });
    }
    try {
        const snapshot = await adminDb.collection('devices').get();
        if (snapshot.empty) {
            console.log('No devices found in Firestore.');
            return NextResponse.json([]);
        }
        
        const devices = snapshot.docs.map(doc => {
            const data = doc.data();
            
            let timestampStr = new Date().toISOString();
            if (data.timestamp) {
                if (typeof data.timestamp === 'string') {
                    timestampStr = data.timestamp;
                } else if (data.timestamp.toDate) { // Handle Firestore Timestamp
                    timestampStr = data.timestamp.toDate().toISOString();
                }
            }

            // Handle nested location object vs. simple string
            let locationName = 'Unknown Location';
            let coords = { lat: 0, lng: 0 };
            if (typeof data.location === 'string') {
                locationName = data.location;
            } else if (typeof data.location === 'object' && data.location.name) {
                locationName = data.location.name;
            }
            
            if (data.coords) {
                coords = data.coords;
            } else if (typeof data.location === 'object' && data.location.lat && data.location.lng) {
                coords = { lat: data.location.lat, lng: data.location.lng };
            }

            return {
                id: data.id,
                name: data.name,
                location: locationName,
                coords: coords,
                status: data.status,
                coLevel: data.coLevel,
                timestamp: timestampStr,
                historicalData: data.historicalData || []
            } as Device;
        });

        return NextResponse.json(devices);

    } catch (error) {
        console.error('[API GET ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
