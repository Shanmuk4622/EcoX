
'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Device } from '@/lib/types';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// This function is now designed to be triggered when a new reading is added.
// In a real-world scenario, this would likely be a Firebase Function triggered by a Firestore event.
// For this app, we'll simulate this by having a script or another service POST here.
export async function POST(request: Request) {
  if (!adminDb) {
      return NextResponse.json({ error: 'Firestore not initialized. Check server environment variables.' }, { status: 500 });
  }
  try {
    const payload = await request.json(); // Expects { deviceId: string, coLevel: number, timestamp: string }
    const { deviceId, coLevel, timestamp } = payload;

    if (!deviceId || typeof coLevel !== 'number' || !timestamp) {
        return NextResponse.json({ error: 'Invalid payload. Expecting deviceId, coLevel, and timestamp.' }, { status: 400 });
    }

    const deviceRef = adminDb.collection('devices').doc(deviceId);

    // Atomically update the device document
    await deviceRef.update({
      coLevel: coLevel,
      timestamp: Timestamp.fromDate(new Date(timestamp)),
      // Prepend the new reading to the historicalData array and keep the last 20 readings
      historicalData: FieldValue.arrayUnion({ coLevel, timestamp }),
    });

    // To keep the array trimmed to the last 20, we'll do a separate read-update.
    // In a high-throughput system, you might handle this differently (e.g., a scheduled cleanup function).
    const doc = await deviceRef.get();
    const data = doc.data();
    if (data && data.historicalData.length > 20) {
        const trimmedData = data.historicalData.slice(0, 20);
        await deviceRef.update({ historicalData: trimmedData });
    }

    return NextResponse.json({ message: 'Device data updated successfully' });
  } catch (error) {
    console.error('[API POST ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
    if (!adminDb) {
        return NextResponse.json({ error: 'Firestore not initialized. Check server environment variables.' }, { status: 500 });
    }
    try {
        const snapshot = await adminDb.collection('devices').get();
        if (snapshot.empty) {
            return NextResponse.json([]);
        }
        
        const devices: Device[] = snapshot.docs.map(doc => {
            const data = doc.data();
            const timestamp = (data.timestamp as Timestamp)?.toDate().toISOString() || new Date().toISOString();

            return {
                id: doc.id,
                name: data.name || 'Unknown Device',
                location: data.location?.name || 'Unknown Location',
                coords: { lat: data.location?.lat || 0, lng: data.location?.lng || 0 },
                status: data.status || 'inactive',
                coLevel: data.coLevel || 0,
                timestamp: timestamp,
                historicalData: data.historicalData || [],
            };
        });

        return NextResponse.json(devices);

    } catch (error) {
        console.error('[API GET ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
