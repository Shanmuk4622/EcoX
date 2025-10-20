
'use server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { initialDevices } from '@/lib/data'; // We'll reuse the initial device data

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  if (!supabaseAdmin) {
    console.error('Error seeding database: Supabase not initialized correctly.');
    return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });
  }

  try {
    console.log("Starting to seed database...");

    // Supabase client's insert method can take an array of objects
    const { data, error } = await supabaseAdmin
      .from('devices')
      .insert(initialDevices);

    if (error) {
      // Throw the error to be caught by the catch block
      throw new Error(`Supabase insert error: ${error.message}`);
    }

    console.log(`Seeded ${initialDevices.length} devices successfully.`);
    return NextResponse.json({ message: `Seeded ${initialDevices.length} devices successfully.` });

  } catch (error) {
    console.error('Error seeding database:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
