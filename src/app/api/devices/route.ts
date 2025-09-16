
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
    
    // This handles both the Python script's payload and any other format
    const firestoreTimestamp = json.timestamp && json.timestamp._seconds ? 
        Timestamp.fromMillis(json.timestamp._seconds * 1000) : 
        Timestamp.now();

    // Directly use the parsed data, assuming it's valid for this simple forwarder.
    const payload = {
        name: json.name,
        location: {
            name: json.location.name,
            lat: json.location.lat,
            lng: json.location.lng,
        },
        status: json.status,
        coLevel: json.coLevel,
        timestamp: firestoreTimestamp,
    };
    
    const deviceRef = adminDb.collection('devices').doc(json.id);
    await deviceRef.set(payload, { merge: true });
    
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
            
            const timestampStr = data.timestamp?.toDate?.().toISOString() || new Date().toISOString();
            
            let locationName = 'Unknown Location';
            let coords = { lat: 0, lng: 0 };
            if (typeof data.location === 'string') {
                locationName = data.location;
            } else if (data.location && typeof data.location === 'object') {
                locationName = data.location.name || 'Unknown Location';
                coords = { lat: data.location.lat || 0, lng: data.location.lng || 0 };
            }

            return {
                id: doc.id,
                name: data.name || 'Unknown Device',
                location: locationName,
                coords: coords,
                status: data.status || 'inactive',
                coLevel: data.coLevel || 0,
                timestamp: timestampStr,
                historicalData: [{ coLevel: data.coLevel, timestamp: timestampStr }],
            };
        });

        return NextResponse.json(devices);

    } catch (error) {
        console.error('[API GET ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
