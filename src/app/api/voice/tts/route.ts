
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

// Smart text splitting function
function splitTextIntoChunks(text: string): { chunk1: string; chunk2: string } {
  // Clean the text
  const cleanText = text.trim();
  
  // If text is short, don't split
  if (cleanText.length <= 80) {
    return { chunk1: cleanText, chunk2: '' };
  }
  
  // Find the best split point (prioritize sentence endings, then commas, then spaces)
  let splitPoint = -1;
  const maxChunk1Length = Math.min(100, Math.floor(cleanText.length * 0.4)); // 40% or 100 chars max
  
  // Look for sentence endings within reasonable range
  for (let i = 30; i <= maxChunk1Length; i++) {
    const char = cleanText[i];
    if (char === '.' || char === '!' || char === '?') {
      // Make sure it's not an abbreviation by checking next character
      if (i + 1 < cleanText.length && cleanText[i + 1] === ' ') {
        splitPoint = i + 1;
        break;
      }
    }
  }
  
  // If no sentence ending found, look for comma or natural pause
  if (splitPoint === -1) {
    for (let i = 40; i <= maxChunk1Length; i++) {
      const char = cleanText[i];
      if (char === ',' || char === ';') {
        if (i + 1 < cleanText.length && cleanText[i + 1] === ' ') {
          splitPoint = i + 1;
          break;
        }
      }
    }
  }
  
  // If no good punctuation split, find last space within range
  if (splitPoint === -1) {
    for (let i = maxChunk1Length; i >= 30; i--) {
      if (cleanText[i] === ' ') {
        splitPoint = i + 1;
        break;
      }
    }
  }
  
  // Fallback: just split at maxChunk1Length
  if (splitPoint === -1) {
    splitPoint = maxChunk1Length;
  }
  
  const chunk1 = cleanText.substring(0, splitPoint).trim();
  const chunk2 = cleanText.substring(splitPoint).trim();
  
  console.log(`🔪 [TTS-CHUNK] Split text: "${chunk1}" | "${chunk2}"`);
  
  return { chunk1, chunk2 };
}

// Generate TTS for a single chunk
async function generateTTSChunk(text: string, character: string, chunkNumber: number): Promise<string | null> {
  try {
    const voiceId = VOICE_MAPPINGS[character] || VOICE_MAPPINGS['gojo'];
    console.log(`🔊 [TTS-CHUNK-${chunkNumber}] Generating for ${character}: "${text.substring(0, 30)}..."`);

    const payload = {
      text: text,
      reference_id: voiceId,
      format: 'wav',
      chunk_length: 100,
      normalize: true,
      latency: 'low',
      references: []
    };

    const packedPayload = msgpack.encode(payload);

    const response = await fetch(FISH_AUDIO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
        'Content-Type': 'application/msgpack',
        'model': 's1'
      },
      body: packedPayload,
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      console.error(`❌ [TTS-CHUNK-${chunkNumber}] Fish Audio API error:`, response.status);
      return null;
    }

    const audioBytes = await response.arrayBuffer();
    
    if (!audioBytes || audioBytes.byteLength === 0) {
      console.error(`❌ [TTS-CHUNK-${chunkNumber}] Empty audio response`);
      return null;
    }

    const audioBase64 = Buffer.from(audioBytes).toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;
    
    console.log(`✅ [TTS-CHUNK-${chunkNumber}] Generated: ${audioBytes.byteLength} bytes`);
    return audioDataUrl;

  } catch (error) {
    console.error(`❌ [TTS-CHUNK-${chunkNumber}] Error:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔊 [TTS-2CHUNK] Starting 2-chunk TTS strategy...');

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
      console.error('❌ [TTS-2CHUNK] Fish Audio API key not configured');
      return NextResponse.json({ error: 'Voice service not configured' }, { status: 500 });
    }

    const startTime = Date.now();

    // Step 1: Split text into 2 chunks
    const { chunk1, chunk2 } = splitTextIntoChunks(text);
    console.log(`🎯 [TTS-2CHUNK] Chunk 1 (${chunk1.length} chars): "${chunk1}"`);
    console.log(`🎯 [TTS-2CHUNK] Chunk 2 (${chunk2.length} chars): "${chunk2}"`);

    // Step 2: Generate first chunk immediately
    console.log('⚡ [TTS-2CHUNK] Processing chunk 1 for immediate response...');
    const chunk1Audio = await generateTTSChunk(chunk1, character, 1);
    
    if (!chunk1Audio) {
      console.error('❌ [TTS-2CHUNK] Failed to generate chunk 1, falling back to full text');
      // Fallback to original single-chunk processing
      const fallbackAudio = await generateTTSChunk(text, character, 0);
      if (!fallbackAudio) {
        return NextResponse.json({ error: 'Voice generation failed' }, { status: 500 });
      }
      
      const processingTime = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        audio: fallbackAudio,
        character: character,
        text: text,
        processingTime: processingTime,
        model: 's1',
        strategy: 'fallback'
      });
    }

    // Step 3: Start processing chunk 2 in parallel (don't wait)
    let chunk2Promise: Promise<string | null> | null = null;
    if (chunk2) {
      console.log('🔄 [TTS-2CHUNK] Starting chunk 2 processing in parallel...');
      chunk2Promise = generateTTSChunk(chunk2, character, 2);
    }

    const chunk1ProcessingTime = Date.now() - startTime;
    console.log(`⚡ [TTS-2CHUNK] Chunk 1 ready in ${chunk1ProcessingTime}ms - sending immediate response!`);

    // Step 4: Return immediate response with chunk 1
    const response = {
      success: true,
      audio: chunk1Audio,
      character: character,
      text: chunk1, // Return chunk 1 text for frontend
      fullText: text, // Include full text for reference
      processingTime: chunk1ProcessingTime,
      model: 's1',
      strategy: '2chunk',
      isFirstChunk: true,
      hasSecondChunk: !!chunk2
    };

    // Step 5: If there's a second chunk, handle it asynchronously
    if (chunk2Promise) {
      // Process chunk 2 in the background and store/cache it
      chunk2Promise.then(async (chunk2Audio) => {
        if (chunk2Audio) {
          const totalProcessingTime = Date.now() - startTime;
          console.log(`✅ [TTS-2CHUNK] Chunk 2 ready in ${totalProcessingTime}ms total`);
          
          // Here you could implement chunk 2 delivery:
          // Option 1: Store in cache/database for immediate retrieval
          // Option 2: Use WebSocket to push to client
          // Option 3: Client polls for chunk 2
          
          // For now, just log success
          console.log(`🎉 [TTS-2CHUNK] Complete! Chunk 1: ${chunk1ProcessingTime}ms, Total: ${totalProcessingTime}ms`);
        } else {
          console.warn('⚠️ [TTS-2CHUNK] Chunk 2 generation failed');
        }
      }).catch(error => {
        console.error('❌ [TTS-2CHUNK] Chunk 2 error:', error);
      });
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [TTS-2CHUNK] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate voice' 
    }, { status: 500 });
  }
}
