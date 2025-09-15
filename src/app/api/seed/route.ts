
'use server';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase';
import { initialDevices } from '@/lib/data';

export async function GET() {
  if (!adminDb || typeof adminDb.collection !== 'function') {
    console.error('Error seeding database: Firestore not initialized correctly.');
    return NextResponse.json({ error: 'Firestore not initialized' }, { status: 500 });
  }

  try {
    const devicesCollection = adminDb.collection('devices');
    const batch = adminDb.batch();

    initialDevices.forEach(device => {
      const deviceRef = devicesCollection.doc(device.id);
      batch.set(deviceRef, device);
    });

    await batch.commit();
    
    console.log(`Seeded ${initialDevices.length} devices successfully.`);
    return NextResponse.json({ message: `Seeded ${initialDevices.length} devices successfully.` });

  } catch (error) {
    console.error('Error seeding database:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
