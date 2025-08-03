import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Character from '@/models/Character';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/characters/unlock - Unlock a character
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await req.json();
    const { characterId } = data;
    
    if (!characterId) {
      return NextResponse.json({ error: 'Character ID is required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const character = await Character.findOne({ id: characterId });
    
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }
    
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if character is already unlocked
    if (user.unlockedCharacters.includes(characterId)) {
      return NextResponse.json({ error: 'Character already unlocked' }, { status: 400 });
    }
    
    // Check if user has enough diamonds
    if (user.diamonds < character.cost) {
      return NextResponse.json({ 
        error: 'Not enough diamonds', 
        required: character.cost, 
        available: user.diamonds 
      }, { status: 400 });
    }
    
    // Unlock character
    user.diamonds -= character.cost;
    user.unlockedCharacters.push(characterId);
    await user.save();
    
    return NextResponse.json({ 
      message: 'Character unlocked successfully',
      remainingDiamonds: user.diamonds,
      unlockedCharacters: user.unlockedCharacters
    });
  } catch (error) {
    console.error('Error unlocking character:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
