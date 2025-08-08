
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear session cookie
    response.cookies.delete('__session');
    
    return response;
  } catch (error) {
    console.error('Error signing out:', error);
    return NextResponse.json({ error: 'Signout failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
