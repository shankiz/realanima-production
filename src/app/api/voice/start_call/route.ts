
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Character greetings for voice calls
const CHARACTER_GREETINGS = {
  'gojo': "Yo! The strongest sorcerer is here. Ready to chat?",
  'mikasa': "Hello. I'm ready to speak with you. What would you like to talk about?",
  'megumin': "Behold! I am Megumin, the greatest arch wizard! Let us converse about the art of explosion magic!",
  'eren': "I'm Eren Yeager. Let's talk about freedom and what it means to fight for what you believe in.",
  'tanjiro': "Hello! I'm Tanjiro Kamado. I'm happy to talk with you about anything that's on your mind.",
  'zenitsu': "Ah! H-hello! I'm Zenitsu! Please be gentle with me during our conversation!",
  'levi': "I'm Levi. I don't have much time for idle chatter, but I'll listen to what you have to say.",
  'nezuko': "Mmph mmph! *happy sounds* (Hello! I'm excited to talk with you!)"
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { character } = body;
    
    if (!character) {
      return NextResponse.json({ error: 'Character is required' }, { status: 400 });
    }
    
    // Get greeting text for the character
    const greetingText = CHARACTER_GREETINGS[character] || CHARACTER_GREETINGS['gojo'];
    
    // Generate TTS audio for the greeting
    let audioData = null;
    try {
      const ttsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: character,
          text: greetingText
        })
      });
      
      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json();
        if (ttsData.status === 'success' && ttsData.audio) {
          audioData = ttsData.audio;
        }
      }
    } catch (error) {
      console.error('Failed to generate greeting TTS:', error);
    }
    
    const response = {
      text: greetingText,
      audio: audioData
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error in start_call:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
