import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Character from '@/models/Character';
// User type removed as it's not used
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/characters/:id - Get character details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await connectToDatabase();

    const character = await Character.findOne({ id });

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    return NextResponse.json({ character });
  } catch (error) {
    console.error('Error fetching character details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}