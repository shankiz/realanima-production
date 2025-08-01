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

// In-memory cache for second chunks (simple implementation)
const chunkCache = new Map<string, { chunk2Audio: string; timestamp: number }>();

// Clean up old cache entries (older than 30 seconds)
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of chunkCache.entries()) {
    if (now - value.timestamp > 30000) {
      chunkCache.delete(key);
    }
  }
}

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

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { character, text, generateVoice = true, requestChunk = 1 } = body;

    console.log(`🔊 [TTS-PARALLEL] Request received for character: ${character}, chunk: ${requestChunk}`);
    console.log(`📝 [TTS-PARALLEL] Text length: ${text?.length} characters`);

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!character) {
      return NextResponse.json({ error: 'Character is required' }, { status: 400 });
    }

    const startTime = Date.now();

    // Check if text is long enough to benefit from 2-chunk strategy
    const shouldUse2Chunks = text.length > 100;

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

    // Handle second chunk requests (check cache first)
    if (requestChunk === 2) {
      console.log('🎯 [TTS-PARALLEL] Processing second chunk request...');

      // Check if we have the second chunk cached
      const cached = chunkCache.get(cacheKey);
      if (cached) {
        console.log('⚡ [TTS-PARALLEL] Second chunk found in cache!');
        const processingTime = Date.now() - startTime;

        // Clean up the cache entry since it's been used
        chunkCache.delete(cacheKey);

        return NextResponse.json({
          success: true,
          audio: cached.chunk2Audio,
          character: character,
          text: splitTextIntoChunks(text).chunk2,
          fullText: text,
          processingTime: processingTime,
          model: 's1',
          strategy: 'parallel-cached',
          isFirstChunk: false,
          chunkNumber: 2
        });
      } else {
        // Cache miss - generate on demand (fallback)
        console.log('⚠️ [TTS-PARALLEL] Second chunk not in cache, generating on demand...');
        const { chunk2 } = splitTextIntoChunks(text);

        if (!chunk2) {
          return NextResponse.json({ error: 'No second chunk available' }, { status: 404 });
        }

        const chunk2Audio = await generateTTSChunk(chunk2, character, 2);
        if (!chunk2Audio) {
          return NextResponse.json({ error: 'Second chunk generation failed' }, { status: 500 });
        }

        const processingTime = Date.now() - startTime;
        console.log(`✅ [TTS-PARALLEL] Second chunk ready in ${processingTime}ms`);

        return NextResponse.json({
          success: true,
          audio: chunk2Audio,
          character: character,
          text: chunk2,
          fullText: text,
          processingTime: processingTime,
          model: 's1',
          strategy: 'parallel-fallback',
          isFirstChunk: false,
          chunkNumber: 2
        });
      }
    }

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