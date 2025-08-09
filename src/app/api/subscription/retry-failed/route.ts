
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!adminAuth) {
      console.error('❌ Firebase Admin not initialized');
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 500 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    console.log(`🔄 Retrying failed payment for user: ${uid}`);

    if (!adminDb) {
      console.error('❌ Firebase Admin DB not initialized');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Get user's subscription
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const subscription = userData?.subscription;

    if (!subscription || subscription.cancelReason !== 'payment_failed') {
      return NextResponse.json({ error: 'No failed payment to retry' }, { status: 400 });
    }

    // Attempt to charge the user again
    const chargeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/subscription/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: uid,
        forceCharge: true,
      }),
    });

    const chargeResult = await chargeResponse.json();

    if (chargeResponse.ok) {
      // Reactivate subscription
      await userRef.update({
        'subscription.status': 'active',
        'subscription.cancelReason': null,
        'subscription.lastFailedAt': null,
        currentPlan: subscription.planId,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment retry successful - subscription reactivated',
        result: chargeResult
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Payment retry failed',
        error: chargeResult.error
      }, { status: 402 });
    }

  } catch (error) {
    console.error('❌ Retry payment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
