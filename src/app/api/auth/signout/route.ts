
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Clear the session cookie using the cookies API
    const cookieStore = await cookies();
    cookieStore.delete('__session');
    
    // Also create a response with cookie clearing
    const response = NextResponse.json({ 
      success: true, 
      message: 'Signed out successfully' 
    });
    
    // Set cookie to expire immediately
    response.cookies.set('__session', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    
    return response;
  } catch (error) {
    console.error('Error signing out:', error);
    return NextResponse.json(
      { error: 'Signout failed' }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' }, 
    { status: 405 }
  );
}
