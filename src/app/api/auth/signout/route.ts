
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: 'Signed out successfully' });
    
    // Clear session cookie
    response.cookies.set('__session', '', {
      expires: new Date(0),
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Error signing out:', error);
    return NextResponse.json({ error: 'Signout failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}
