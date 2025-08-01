
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import * as msgpack from '@msgpack/msgpack';

const FISH_AUDIO_API_KEY = process.env.FISH_AUDIO_API_KEY;
const FISH_AUDIO_API_URL = 'https://api.fish.audio/v1/tts';

// Character voice mappings for Fish.Audio
const VOICE_MAPPINGS = {
  'gojo': '323dc6ca4f4f491996383de8be396425',
  'mikasa': '7ac4505f7f714a9181681b6c367f33bd',
  'tanjiro': '5926dcd0aae6441c8355ecb3b8bf28bb',
  'levi': 'b67e283da1224a3a8dadc36b6ce6d795',
  'eren': '2a1b57c3fcc448dc9bffd9a4d25f72d6',
  'nezuko': 'provide correct id',
  'megumin': 'provide correct id',
  'zenitsu': 'provide correct id'
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔊 [TTS-RAW] Starting raw Fish Audio API request with s1 model...');

    // Verify Firebase auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    const { character, text, generateVoice } = await request.json();

    if (!character || !text) {
      return NextResponse.json({ error: 'Missing character or text' }, { status: 400 });
    }

    if (!generateVoice) {
      return NextResponse.json({ 
        success: true, 
        skipVoice: true,
        message: 'Voice generation disabled' 
      });
    }

    if (!FISH_AUDIO_API_KEY) {
      console.error('❌ [TTS-RAW] Fish Audio API key not configured');
      return NextResponse.json({ error: 'Voice service not configured' }, { status: 500 });
    }

    // Get voice ID for character
    const voiceId = VOICE_MAPPINGS[character] || VOICE_MAPPINGS['gojo'];
    console.log(`🔊 [TTS-RAW] Generating for ${character} (${voiceId}) using s1 model: "${text.substring(0, 50)}..."`);

    const startTime = Date.now();

    try {
      // Prepare the request payload using Fish Audio MessagePack format
      const payload = {
        text: text,
        reference_id: voiceId,
        format: 'wav',
        chunk_length: 100,
        normalize: true,
        latency: 'low',
        references: []
      };

      console.log('🔄 [TTS-RAW] Sending MessagePack request to Fish Audio API with s1 model...');

      // Pack the payload using MessagePack
      const packedPayload = msgpack.encode(payload);

      // Make direct request to Fish Audio API using MessagePack and s1 model with connection pooling
      const response = await fetch(FISH_AUDIO_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
          'Content-Type': 'application/msgpack',
          'model': 's1' // Specify s1 model for fastest performance
        },
        body: packedPayload,
        // Add timeout for reliability
        signal: AbortSignal.timeout(12000) // Reduced to 12 second timeoutt
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [TTS-RAW] Fish Audio API error (${response.status}):`, errorText);
        return NextResponse.json({ 
          error: `Voice generation failed: ${response.status}` 
        }, { status: 500 });
      }

      // Get the audio data as bytes
      const audioBytes = await response.arrayBuffer();
      
      if (!audioBytes || audioBytes.byteLength === 0) {
        console.error('❌ [TTS-RAW] Empty audio response from Fish Audio API');
        return NextResponse.json({ 
          error: 'Voice generation returned empty audio' 
        }, { status: 500 });
      }

      // Convert to base64 for frontend
      const audioBase64 = Buffer.from(audioBytes).toString('base64');
      const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;

      const processingTime = Date.now() - startTime;
      console.log(`✅ [TTS-RAW] Audio generated successfully with s1 model: ${audioBytes.byteLength} bytes in ${processingTime}ms`);

      return NextResponse.json({
        success: true,
        audio: audioDataUrl,
        character: character,
        text: text,
        processingTime: processingTime,
        model: 's1'
      });

    } catch (fetchError) {
      console.error('❌ [TTS-RAW] Fetch error:', fetchError);
      
      let errorMessage = 'Voice generation failed';
      if (fetchError.name === 'AbortError' || fetchError.message.includes('timeout')) {
        errorMessage = 'Voice generation timed out - please try again';
      } else if (fetchError.message.includes('network') || fetchError.message.includes('fetch')) {
        errorMessage = 'Network error - please check your connection';
      }

      return NextResponse.json({ 
        error: errorMessage 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ [TTS-RAW] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate voice' 
    }, { status: 500 });
  }
}
