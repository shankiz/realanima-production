import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: 'This endpoint is no longer used. Please use the traditional PayPal subscription flow.' 
  }, { status: 410 }); // 410 Gone
}