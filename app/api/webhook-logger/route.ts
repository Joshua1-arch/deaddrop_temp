import { NextResponse } from 'next/server';

// In-memory cache to store the recent Tatum webhook events (max 15)
const webhookEvents: any[] = [];

export async function GET() {
  return NextResponse.json(webhookEvents);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Structure the event with unique ID and timestamp
    const newEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      payload: body,
      type: body.type || 'ADDRESS_TRANSACTION',
    };
    
    webhookEvents.unshift(newEvent);
    if (webhookEvents.length > 15) {
      webhookEvents.pop();
    }
    
    return NextResponse.json({ success: true, event: newEvent });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Invalid payload' },
      { status: 400 }
    );
  }
}
