import { NextRequest, NextResponse } from 'next/server';
import { SimplifiedVoiceService } from '@/services/SimplifiedVoiceService';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ character: string }> }
) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify the Firebase token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user from Firestore to check plan
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const currentPlan = userData?.currentPlan || 'free';

    // Check if user has voice access (only premium and ultimate plans)
    if (currentPlan === 'free') {
      return NextResponse.json({ 
        error: 'Voice responses are only available for Premium and Ultimate plans',
        requiresUpgrade: true,
        currentPlan: 'free'
      }, { status: 403 });
    }

    const { character } = await params;
    const { message } = await request.json();

    if (!character || !message) {
      return NextResponse.json({ error: 'Missing character or message' }, { status: 400 });
    }

    const service = new SimplifiedVoiceService();
    const response = await service.get_response(character, message);

    return NextResponse.json({ response });

  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}