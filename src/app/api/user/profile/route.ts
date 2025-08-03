import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

// Message limits per plan
const MESSAGE_LIMITS = {
  free: 30,
  premium: 200,
  ultimate: 500
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user data
    const userRef = adminDb.collection('users').doc(decodedToken.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create default user data if doesn't exist
      const defaultUserData = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || 'User',
        currentPlan: 'free',
        messagesLeft: MESSAGE_LIMITS.free,
        subscriptionId: null,
        subscriptionStatus: null,
        createdAt: new Date(),
        lastUpdated: new Date(),
        lastMessageReset: new Date()
      };

      await userRef.set(defaultUserData);

      return NextResponse.json({
        success: true,
        ...defaultUserData
      });
    }

    const userData = userDoc.data();
    
    if (!userData) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 });
    }

    const currentPlan = userData.currentPlan || 'free';
    const messageLimit = MESSAGE_LIMITS[currentPlan as keyof typeof MESSAGE_LIMITS] || MESSAGE_LIMITS.free;

    return NextResponse.json({
      success: true,
      uid: userData.uid,
      email: userData.email,
      name: userData.name,
      currentPlan: userData.currentPlan || 'free',
      messagesLeft: userData.messagesLeft ?? messageLimit,
      subscriptionId: userData.subscriptionId,
      subscriptionStatus: userData.subscriptionStatus,
      lastUpdated: userData.lastUpdated
    });

  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}