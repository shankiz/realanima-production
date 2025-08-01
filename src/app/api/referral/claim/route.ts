import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

// POST /api/referral/claim - Claim referral rewards
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if there are pending rewards
    if (!user.pendingReferralRewards || user.pendingReferralRewards.length === 0) {
      return NextResponse.json({ error: 'No pending rewards' }, { status: 400 });
    }
    
    // Calculate total rewards
    const totalRewards = user.pendingReferralRewards.reduce((sum, reward) => sum + reward.amount, 0);
    
    // Add diamonds to user
    user.diamonds += totalRewards;
    
    // Clear pending rewards
    user.pendingReferralRewards = [];
    
    await user.save();
    
    return NextResponse.json({ 
      message: 'Rewards claimed successfully',
      claimedAmount: totalRewards,
      totalDiamonds: user.diamonds
    });
  } catch (error) {
    console.error('Error claiming referral rewards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
