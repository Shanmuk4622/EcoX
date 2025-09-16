'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase';
import type { Device } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

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
    const firestoreTimestamp = Timestamp.now();
    const newReading = { coLevel: data.coLevel, timestamp: firestoreTimestamp };

    const deviceSnap = await deviceRef.get();

    if (!deviceSnap.exists) {
      // --- Device is NEW, CREATE it --- (Note: No redundant 'id' field)
       await deviceRef.set({
        name: data.name,
        location: data.location.name,
        coords: { lat: data.location.lat, lng: data.location.lng },
        status: data.status,
        coLevel: data.coLevel,
        timestamp: firestoreTimestamp,
        historicalData: [newReading], // Start with the first reading
      });
      console.log(`Successfully created new device: ${data.id}`);
    } else {
      // --- Device EXISTS, UPDATE it ---
      const existingData = deviceSnap.data() || {};
      // Keep the historical data to the last 19 readings
      const historicalData = (existingData.historicalData || []).slice(0, 19);

      await deviceRef.update({
        status: data.status,
        coLevel: data.coLevel,
        timestamp: firestoreTimestamp,
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
        
        const devices: Device[] = snapshot.docs.map((doc: { data: () => any; id: any; }) => {
            const data = doc.data();
            
            // Safely convert Firestore Timestamps to ISO strings for JSON serialization
            const timestampStr = data.timestamp?.toDate?.().toISOString() || new Date().toISOString();
            const historicalData = (data.historicalData || []).map((reading: any) => ({
                ...reading,
                timestamp: reading.timestamp?.toDate?.().toISOString(),
            }));

            return {
                id: doc.id, // Use the document ID, not data.id
                name: data.name || 'Unknown Device',
                location: data.location || 'Unknown Location',
                coords: data.coords || { lat: 0, lng: 0 },
                status: data.status || 'inactive',
                coLevel: data.coLevel || 0,
                timestamp: timestampStr,
                historicalData: historicalData,
            };
        });

        return NextResponse.json(devices);

    } catch (error) {
        console.error('[API GET ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
