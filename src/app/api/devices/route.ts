
'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Device } from '@/lib/types';
import { Timestamp }from 'firebase-admin/firestore';

export async function POST(request: Request) {
  if (!adminDb) {
      return NextResponse.json({ error: 'Firestore not initialized' }, { status: 500 });
  }
  try {
    const payload = await request.json();
    const deviceRef = adminDb.collection('devices').doc(payload.id);
    await deviceRef.set({
      ...payload,
      timestamp: Timestamp.now()
    }, { merge: true });
    return NextResponse.json({ message: 'Data received successfully' });
  } catch (error) {
    console.error('[API POST ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
    if (!adminDb) {
        return NextResponse.json({ error: 'Firestore not initialized' }, { status: 500 });
    }
    try {
        const snapshot = await adminDb.collection('devices').get();
        if (snapshot.empty) {
            return NextResponse.json([]);
        }
        
        const devices: Device[] = snapshot.docs.map(doc => {
            const data = doc.data();
            const timestamp = (data.timestamp as Timestamp).toDate().toISOString();

            return {
                id: doc.id,
                name: data.name || 'Unknown Device',
                location: data.location.name || 'Unknown Location',
                coords: { lat: data.location.lat || 0, lng: data.location.lng || 0 },
                status: data.status || 'inactive',
                coLevel: data.coLevel || 0,
                timestamp: timestamp,
                historicalData: [{ coLevel: data.coLevel, timestamp: timestamp }],
            };
        });

        return NextResponse.json(devices);

    } catch (error) {
        console.error('[API GET ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
