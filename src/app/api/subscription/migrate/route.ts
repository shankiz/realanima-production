
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user's current data
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const currentPlan = userData?.currentPlan;
    
    // Only migrate premium/ultimate users who don't have subscription data
    if (!currentPlan || currentPlan === 'free' || userData?.payerInfo) {
      return NextResponse.json({ message: 'No migration needed' });
    }

    console.log(`🔄 Migrating user ${uid} with plan ${currentPlan}`);

    // Create subscription data for existing premium users
    const subscriptionData = {
      id: `migrated-${uid}-${currentPlan}-${Date.now()}`,
      userId: uid,
      planId: currentPlan,
      status: 'active',
      subscriptionId: `legacy-${uid}-${currentPlan}`,
      createdAt: userData.lastUpdated || new Date().toISOString(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      migrated: true
    };

    // Update user with subscription data
    await userRef.update({
      payerInfo: subscriptionData,
      lastUpdated: new Date().toISOString(),
    });

    console.log(`✅ Successfully migrated user ${uid}`);

    return NextResponse.json({ 
      success: true, 
      message: 'User data migrated successfully',
      subscription: subscriptionData 
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
