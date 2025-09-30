
'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Device } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

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

    // Use a transaction to atomically update the historical data
    await adminDb.runTransaction(async (transaction) => {
        const doc = await transaction.get(deviceRef);
        if (!doc.exists) {
            throw new Error(`Device with ID ${deviceId} not found.`);
        }
        const data = doc.data();
        const existingData = data?.historicalData || [];
        
        const newReading = { coLevel, timestamp };

        // Add new reading and keep the array size to 20
        const updatedHistoricalData = [newReading, ...existingData].slice(0, 20);

        transaction.update(deviceRef, {
            coLevel: coLevel,
            timestamp: Timestamp.fromDate(new Date(timestamp)),
            historicalData: updatedHistoricalData,
        });
    });


    return NextResponse.json({ message: 'Device data updated successfully' });
  } catch (error) {
    console.error('[API POST ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
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
