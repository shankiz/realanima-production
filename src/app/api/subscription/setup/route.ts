import { NextRequest, NextResponse } from 'next/server';
import { PayPalSubscriptionService } from '@/services/PayPalSubscriptionService';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting subscription setup...');

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    if (!adminAuth) {
      console.error('❌ Firebase Admin not initialized');
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 500 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('✅ Token verified for user:', decodedToken.uid);

    const { planId, returnUrl, cancelUrl } = await request.json();

    if (!planId || !returnUrl || !cancelUrl) {
      return NextResponse.json({ 
        error: 'Missing required fields: planId, returnUrl, cancelUrl' 
      }, { status: 400 });
    }

    console.log('📋 Creating vault setup token for plan:', planId);

    const paypalService = new PayPalSubscriptionService();
    const setupToken = await paypalService.createVaultSetupToken(planId, returnUrl, cancelUrl);

    console.log('✅ Vault setup token created:', setupToken.id);

    return NextResponse.json({
      id: setupToken.id,
      status: setupToken.status,
      links: setupToken.links
    });

  } catch (error) {
    console.error('❌ Subscription setup error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}