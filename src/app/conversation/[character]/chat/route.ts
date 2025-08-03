
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const body = await request.json();
    const { message, character } = body;

    // Find user and deduct message
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.messagesRemaining <= 0) {
      return NextResponse.json({ error: 'No messages remaining' }, { status: 403 });
    }

    // Deduct message
    user.messagesRemaining -= 1;
    await user.save();

    return NextResponse.json({ 
      success: true, 
      messagesRemaining: user.messagesRemaining 
    });

  } catch (error) {
    console.error('Error in conversation route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
