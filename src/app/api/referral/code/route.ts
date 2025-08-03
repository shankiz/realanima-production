import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import crypto from 'crypto';

// GET /api/referral/code - Get user's referral code
export async function GET() {
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
    
    // Generate referral code if not exists
    if (!user.referralCode) {
      user.referralCode = crypto.randomBytes(6).toString('hex');
      await user.save();
    }
    
    return NextResponse.json({ 
      referralCode: user.referralCode,
      referralUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/register?ref=${user.referralCode}`
    });
  } catch (error) {
    console.error('Error getting referral code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
