import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/firebase/admin';
import { getUserData, updateUserActivity } from '@/lib/firebase/admin-helpers';

interface DecodedToken {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    // Verify the session token
    let decodedToken: DecodedToken;
    try {
      decodedToken = await verifySessionCookie(sessionCookie.value);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get user data from Firestore
    const userData = await getUserData(decodedToken.uid);

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user activity
    await updateUserActivity(decodedToken.uid);

    const user = {
      uid: decodedToken.uid,
      email: decodedToken.email || userData.email,
      name: decodedToken.name || userData.name,
      picture: decodedToken.picture || userData.picture,
      email_verified: decodedToken.email_verified || userData.email_verified || false,
      // Include additional user data from Firestore
      messagesRemaining: userData.messagesRemaining || 0,
      totalMessages: userData.totalMessages || 0,
      credits: userData.credits || 0,
      subscription: userData.subscription || null,
      subscriptionId: userData.subscriptionId || null,
      subscriptionStatus: userData.subscriptionStatus || null,
      unlockedCharacters: userData.unlockedCharacters || [],
      createdAt: userData.createdAt,
      lastActivity: userData.lastActivity,
      referralCode: userData.referralCode,
      referredBy: userData.referredBy || null,
      referralCreditsEarned: userData.referralCreditsEarned || 0,
      totalReferrals: userData.totalReferrals || 0,
      isEmailVerified: userData.isEmailVerified || false,
      verificationToken: userData.verificationToken || null,
      privacySettings: userData.privacySettings || {
        allowDataCollection: true,
        allowPersonalization: true,
        shareUsageStats: false
      }
    };

    return NextResponse.json({ 
      user,
      authenticated: true 
    });

  } catch (error: unknown) {
    console.error('Session verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'ID token required' }, { status: 400 });
    }

    // Verify the ID token
    let decodedToken: DecodedToken;
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch (error: unknown) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Create session cookie (expires in 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
    const expires = new Date(Date.now() + expiresIn);

    const response = NextResponse.json({ 
      message: 'Session created successfully',
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        email_verified: decodedToken.email_verified
      }
    });

    // Set the session cookie
    response.cookies.set('session', idToken, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;

  } catch (error: unknown) {
    console.error('Session creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ message: 'Session deleted successfully' });

    // Clear the session cookie
    response.cookies.set('session', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;

  } catch (error: unknown) {
    console.error('Session deletion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}