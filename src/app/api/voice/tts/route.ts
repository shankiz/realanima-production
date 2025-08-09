import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import * as msgpack from '@msgpack/msgpack';

const FISH_AUDIO_API_KEY = process.env.FISH_AUDIO_API_KEY;
const FISH_AUDIO_API_URL = 'https://api.fish.audio/v1/tts';

// Character voice mappings for Fish.Audio
const VOICE_MAPPINGS: Record<string, string> = {
  'gojo': '323dc6ca4f4f491996383de8be396425',
  'mikasa': '7ac4505f7f714a9181681b6c367f33bd',
  'tanjiro': '5926dcd0aae6441c8355ecb3b8bf28bb',
  'levi': 'b67e283da1224a3a8dadc36b6ce6d795',
  'eren': '2a1b57c3fcc448dc9bffd9a4d25f72d6',
  'nezuko': 'provide correct id',
  'megumin': 'provide correct id',
  'zenitsu': 'provide correct id'
};

// In-memory cache for second chunks (simple implementation)
const chunkCache = new Map<string, { chunk2Audio: string; timestamp: number }>();

// Optimized cache cleanup with batching
function cleanupCache() {
  const now = Date.now();
  const keysToDelete: string[] = [];

  // Batch delete operations for better performance
  for (const [key, value] of chunkCache.entries()) {
    if (now - value.timestamp > 30000) {
      keysToDelete.push(key);
    }
  }

  // Delete in batch
  keysToDelete.forEach(key => chunkCache.delete(key));

  if (keysToDelete.length > 0) {
    console.log(`🧹 [TTS-CACHE] Cleaned up ${keysToDelete.length} old cache entries`);
  }
}

// Optimized text splitting function for faster first chunk
function splitTextIntoChunks(text: string): { chunk1: string; chunk2: string } {
  // Clean the text
  const cleanText = text.trim();

  // If text is short, don't split
  if (cleanText.length <= 60) {
    return { chunk1: cleanText, chunk2: '' };
  }

  // Prioritize VERY short first chunk for instant response (20-50 chars)
  let splitPoint = -1;
  const minChunk1Length = 15; // Minimum viable chunk
  const maxChunk1Length = Math.min(50, Math.floor(cleanText.length * 0.3)); // 30% or 50 chars max

  // Look for early sentence endings for super quick first chunk
  for (let i = minChunk1Length; i <= maxChunk1Length; i++) {
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
    for (let i = minChunk1Length; i <= maxChunk1Length; i++) {
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
    for (let i = maxChunk1Length; i >= minChunk1Length; i--) {
      if (cleanText[i] === ' ') {
        splitPoint = i + 1;
        break;
      }
    }
  }

  // Fallback: just split at maxChunk1Length
  if (splitPoint === -1) {
    splitPoint = Math.min(maxChunk1Length, cleanText.length);
  }

  const chunk1 = cleanText.substring(0, splitPoint).trim();
  const chunk2 = cleanText.substring(splitPoint).trim();

  console.log(`🔪 [TTS-CHUNK] Optimized split: "${chunk1}" (${chunk1.length} chars) | "${chunk2}" (${chunk2.length} chars)`);

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
      format: 'mp3', // MP3 is faster to generate and smaller
      chunk_length: 200, // Larger chunks for faster processing
      normalize: false, // Skip normalization for speed
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
      signal: AbortSignal.timeout(8000) // Reduced timeout for faster failure recovery
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
  console.log('🔊 [TTS-PARALLEL] Request received');

  try {
    // Check if Firebase Admin is initialized
    if (!adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    // const userId = user.uid;
    const body = await request.json();
    const { character, text, generateVoice = true, requestChunk } = body;
    console.log(`🔊 [TTS-PARALLEL] Request received for character: ${character}, chunk: ${requestChunk || 1}`);
    console.log(`📝 [TTS-PARALLEL] Text length: ${text.length} characters`);

    // Handle second chunk requests
    if (requestChunk === 2) {
      console.log('🎯 [TTS-PARALLEL] Processing second chunk request...');

      // Clean up old cache entries first
      cleanupCache();

      // Check cache for second chunk - use consistent cache key format
      const cacheKey = `${character}-${Buffer.from(text).toString('base64').substring(0, 20)}`;
      const cached = chunkCache.get(cacheKey);

      if (cached && cached.chunk2Audio) {
        console.log('✅ [TTS-PARALLEL] Second chunk found in cache - returning immediately');
        return NextResponse.json({
          success: true,
          audio: cached.chunk2Audio,
          character: character,
          text: text,
          model: 's1',
          strategy: 'parallel-cached',
          isSecondChunk: true,
          chunkNumber: 2
        });
      } else {
        console.log('❌ [TTS-PARALLEL] Second chunk not found in cache');
        return NextResponse.json({ 
          error: 'Second chunk not ready yet',
          success: false 
        }, { status: 404 });
      }
    }

    console.log(`📝 [TTS-PARALLEL] Processing first chunk request`);

    if (!generateVoice) {
      console.log('🔇 [TTS-PARALLEL] Voice generation disabled by request');
      return NextResponse.json({ 
        success: true, 
        skipVoice: true,
        message: 'Voice generation was disabled'
      });
    }

    const startTime = Date.now();

    // Optimize threshold - only use 2-chunk for longer texts where it really helps
    const shouldUse2Chunks = text.length > 80;

    if (!shouldUse2Chunks) {
      console.log('📝 [TTS-PARALLEL] Text too short, using single chunk strategy');
      const singleAudio = await generateTTSChunk(text, character, 0);
      if (!singleAudio) {
        return NextResponse.json({ error: 'Voice generation failed' }, { status: 500 });
      }

      const processingTime = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        audio: singleAudio,
        character: character,
        text: text,
        processingTime: processingTime,
        model: 's1',
        strategy: 'single'
      });
    }

    // Clean up old cache entries
    cleanupCache();

    // Generate cache key for this request
    const cacheKey = `${character}-${Buffer.from(text).toString('base64').substring(0, 20)}`;

    console.log('🚀 [TTS-PARALLEL] Using parallel chunk strategy for optimal user experience');

    // Split text into 2 meaningful chunks
    const { chunk1, chunk2 } = splitTextIntoChunks(text);
    console.log(`📊 [TTS-PARALLEL] Chunk 1 (${chunk1.length} chars): "${chunk1}"`);
    console.log(`📊 [TTS-PARALLEL] Chunk 2 (${chunk2.length} chars): "${chunk2}"`);

    // Start BOTH chunks processing in parallel
    console.log('⚡ [TTS-PARALLEL] Starting parallel processing of both chunks...');

    const chunk1Promise = generateTTSChunk(chunk1, character, 1);
    let chunk2Promise = null;

    if (chunk2) {
      chunk2Promise = generateTTSChunk(chunk2, character, 2);
    }

    // Wait for first chunk to complete
    const chunk1Audio = await chunk1Promise;

    if (!chunk1Audio) {
      console.error('❌ [TTS-PARALLEL] Failed to generate chunk 1, falling back to full text');
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

    const chunk1ProcessingTime = Date.now() - startTime;
    console.log(`⚡ [TTS-PARALLEL] Chunk 1 ready in ${chunk1ProcessingTime}ms - sending immediate response!`);

    // Start background processing for chunk 2 (if it exists)
    if (chunk2Promise) {
      chunk2Promise.then((chunk2Audio) => {
        if (chunk2Audio) {
          const totalTime = Date.now() - startTime;
          console.log(`🎯 [TTS-PARALLEL] Chunk 2 ready in background after ${totalTime}ms - caching for later request`);

          // Cache the second chunk for when frontend requests it
          chunkCache.set(cacheKey, {
            chunk2Audio: chunk2Audio,
            timestamp: Date.now()
          });
        } else {
          console.error('❌ [TTS-PARALLEL] Chunk 2 failed in background');
        }
      }).catch((error) => {
        console.error('❌ [TTS-PARALLEL] Chunk 2 background error:', error);
      });
    }

    // Return immediate response with chunk 1
    const response = {
      success: true,
      audio: chunk1Audio,
      character: character,
      text: chunk1,
      fullText: text,
      processingTime: chunk1ProcessingTime,
      model: 's1',
      strategy: 'parallel',
      isFirstChunk: true,
      hasSecondChunk: !!chunk2,
      chunkNumber: 1
    };

    console.log('📤 [TTS-PARALLEL] Returning first chunk immediately, second chunk processing in background');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [TTS-PARALLEL] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate voice' 
    }, { status: 500 });
  }
}