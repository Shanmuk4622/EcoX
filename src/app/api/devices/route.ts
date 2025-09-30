
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
    const payload = await request.json(); 
    const { deviceId, coLevel, timestamp } = payload;

    if (!deviceId || typeof coLevel !== 'number' || !timestamp) {
        return NextResponse.json({ error: 'Invalid payload. Expecting deviceId, coLevel, and timestamp.' }, { status: 400 });
    }
    
    // Convert incoming timestamp to a valid Date object, no matter the format
    let validDate: Date;
    if (timestamp._seconds !== undefined && timestamp._nanoseconds !== undefined) {
        // Handle Firestore Timestamp object that might be passed as a plain object
        validDate = new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
    } else if (typeof timestamp === 'string') {
        // Handle ISO string format
        validDate = new Date(timestamp);
    } else if (timestamp instanceof Timestamp) {
        // Handle Firestore Timestamp object directly
        validDate = timestamp.toDate();
    }
    else {
        // Fallback to current time if format is unknown, though this path should be avoided
        validDate = new Date();
    }

    if (isNaN(validDate.getTime())) {
      return NextResponse.json({ error: 'Invalid timestamp format.', details: `Received: ${JSON.stringify(timestamp)}` }, { status: 400 });
    }
    
    const isoTimestamp = validDate.toISOString();


    const deviceRef = adminDb.collection('devices').doc(deviceId);

    // Use a transaction to atomically update the historical data
    await adminDb.runTransaction(async (transaction) => {
        const doc = await transaction.get(deviceRef);
        if (!doc.exists) {
            console.error(`Device with ID ${deviceId} not found.`);
            // If the device doesn't exist, we can't update it.
            // Depending on requirements, you might want to create it here.
            return; // Exit transaction
        }
        const data = doc.data();
        // Ensure historicalData is an array, defaulting to empty if it doesn't exist
        const existingData = Array.isArray(data?.historicalData) ? data.historicalData : [];
        
        const newReading = { coLevel, timestamp: isoTimestamp };

        // Add new reading and keep the array size to 20
        // Prepend the new reading and take the first 20 items.
        const updatedHistoricalData = [newReading, ...existingData].slice(0, 20);

        transaction.update(deviceRef, {
            coLevel: coLevel,
            timestamp: Timestamp.fromDate(validDate),
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
