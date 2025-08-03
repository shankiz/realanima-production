
import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
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
