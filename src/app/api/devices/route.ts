
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET() {
  const { data, error } = await supabase
    .from('devices')
    .select(`
      id, 
      name, 
      location, 
      lat, 
      lng,
      readings ( co_level, timestamp )
    `);

  if (error) {
    console.error('Error fetching devices from Supabase:', error);
    return NextResponse.json({ error: 'Failed to fetch device data.' }, { status: 500 });
  }

  return NextResponse.json(data);
}
