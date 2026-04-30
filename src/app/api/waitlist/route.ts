// app/api/waitlist/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, business_name, country, postal_code } = body;

    // Validate input
    if (!email || !business_name || !country || !postal_code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists on waitlist
    const { data: existingEntry } = await supabase
      .from('waitlist')
      .select('id, position')
      .eq('email', email)
      .maybeSingle();

    if (existingEntry) {
      return NextResponse.json(
        {
          message: 'You are already on the waitlist',
          position: existingEntry.position,
        },
        { status: 200 }
      );
    }

    // Get the current max position
    const { data: maxPositionData } = await supabase
      .from('waitlist')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = (maxPositionData?.position || 0) + 1;

    // Determine discount tier
    let discount_tier = null;
    if (nextPosition <= 50) {
      discount_tier = 'tier_1_50_percent';
    } else if (nextPosition <= 100) {
      discount_tier = 'tier_2_25_percent';
    }

    // Insert into waitlist table
    const { data: newEntry, error } = await supabase
      .from('waitlist')
      .insert([
        {
          email: email, 
          business_name: business_name, 
          country: country, 
          postal_code: postal_code,
          position: nextPosition,
          discount_tier,
          created_at: new Date().toISOString(),
          status: 'pending',
        },
      ])
      .select('position')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to join waitlist' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Successfully joined the waitlist',
        position: newEntry.position,
        discount_tier,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}