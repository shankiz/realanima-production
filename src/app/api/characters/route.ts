import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Character from '@/models/Character';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/characters - Get all characters
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const characters = await Character.find({});
    
    return NextResponse.json({ characters });
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
