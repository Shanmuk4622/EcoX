'use server';
import { NextResponse } from 'next/server';
import { collection, writeBatch } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { initialDevices } from '@/lib/data';

export async function GET() {
  try {
    const devicesCollection = collection(firestore, 'devices');
    const batch = writeBatch(firestore);

    initialDevices.forEach(device => {
      const deviceRef = doc(devicesCollection, device.id);
      batch.set(deviceRef, device);
    });

    await batch.commit();
    
    return NextResponse.json({ message: `Seeded ${initialDevices.length} devices successfully.` });

  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}
