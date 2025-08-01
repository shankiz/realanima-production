import { NextRequest, NextResponse } from 'next/server';
import { messageResetService } from '@/lib/messageResetService';

export async function POST(request: NextRequest) {
  try {
    const { userId, forceAll } = await request.json();

    console.log('🔧 Manual reset triggered:', { userId, forceAll });

    if (forceAll) {
      await messageResetService.forceResetAllUsers();
      return NextResponse.json({ 
        success: true, 
        message: 'All users have been force reset with new credit amounts' 
      });
    } else if (userId) {
      await messageResetService.manualReset(userId);
      return NextResponse.json({ 
        success: true, 
        message: `User ${userId} has been reset` 
      });
    } else {
      await messageResetService.manualReset();
      return NextResponse.json({ 
        success: true, 
        message: 'All eligible users have been reset' 
      });
    }
  } catch (error) {
    console.error('❌ Manual reset error:', error);
    return NextResponse.json({ 
      error: 'Reset failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Manual reset endpoint - use POST with optional userId or forceAll=true' 
  });
}