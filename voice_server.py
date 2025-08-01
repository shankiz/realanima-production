
import os
import json
import base64
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import httpx
import dotenv
from fish_audio_sdk import Session, TTSRequest

# Load environment variables
dotenv.load_dotenv()

# Configure API keys
FISH_AUDIO_API_KEY = "3608242596f84b10b284c45af31bedf2"

# Default voice mappings for Fish.Audio (fallback only)
DEFAULT_VOICE_MAPPINGS = {
    'gojo': '323dc6ca4f4f491996383de8be396425',
    'mikasa': '7ac4505f7f714a9181681b6c367f33bd',
    'tanjiro': '5926dcd0aae6441c8355ecb3b8bf28bb',
    'levi': 'b67e283da1224a3a8dadc36b6ce6d795',
    'eren': '2a1b57c3fcc448dc9bffd9a4d25f72d6',
    'nezuko': 'provide correct id',
    'megumin': 'provide correct id',
    'zenitsu': 'provide correct id'
}

# Pre-initialize Fish Audio sessions for maximum speed
fish_sessions = {}

def initialize_tts_services():
    """Pre-initialize Fish Audio SDK sessions for maximum speed"""
    global fish_sessions

    print("🚀 [TTS] Initializing Fish Audio SDK sessions...")

    for character, voice_id in DEFAULT_VOICE_MAPPINGS.items():
        try:
            fish_sessions[character] = Session(FISH_AUDIO_API_KEY)
            print(f"✅ [TTS] Fish Audio session ready for {character}")
        except Exception as e:
            print(f"❌ [TTS] Failed to create Fish Audio session for {character}: {e}")

app = Flask(__name__)
CORS(app)

def text_to_speech_lightning_fast(text, character):
    """Lightning-fast TTS using Fish Audio SDK"""
    try:
        print(f"🔊 [TTS] Generating for {character}: '{text[:30]}...'")

        voice_id = DEFAULT_VOICE_MAPPINGS.get(character, DEFAULT_VOICE_MAPPINGS['gojo'])
        print(f"🔍 [DEBUG] Using voice_id: {voice_id} for character: {character}")
        session = fish_sessions.get(character)

        if not session:
            print(f"❌ [TTS] No session for {character}, trying fallback")
            return text_to_speech_fallback_rest(text, character)

        start_time = time.time()

        # Use fastest settings for maximum performance
        tts_request = TTSRequest(
            text=text,
            reference_id=voice_id,
            format="mp3",
            latency="low",     # Use low latency for fastest response
            normalize=False,
            chunk_length=150   # Optimized chunk length for speed vs quality balance
        )

        # Generate audio using Fish Audio SDK with timeout handling
        audio_chunks = []
        try:
            print(f"🔄 [TTS] Starting audio generation...")
            chunk_count = 0
            for chunk in session.tts(tts_request, backend="s1"):
                audio_chunks.append(chunk)
                chunk_count += 1
                if chunk_count % 10 == 0:  # Progress indicator
                    print(f"🔄 [TTS] Processing chunk {chunk_count}...")
        except Exception as stream_error:
            print(f"❌ [TTS] Streaming error: {stream_error}")
            return text_to_speech_fallback_rest(text, character)

        result = b''.join(audio_chunks)
        processing_time = time.time() - start_time

        if len(result) == 0:
            print("❌ [TTS] Empty result, trying fallback")
            return text_to_speech_fallback_rest(text, character)

        print(f"✅ [TTS] Complete: {len(result)} bytes in {processing_time:.2f}s")
        return result

    except Exception as e:
        print(f"❌ [TTS] Error: {e}")
        import traceback
        traceback.print_exc()
        return text_to_speech_fallback_rest(text, character)

def text_to_speech_fallback_rest(text, character):
    """Fast REST fallback using httpx"""
    try:
        print(f"🔄 [FALLBACK] Using REST API for {character}")
        voice_id = DEFAULT_VOICE_MAPPINGS.get(character, DEFAULT_VOICE_MAPPINGS['gojo'])
        print(f"🔍 [FALLBACK-DEBUG] Using voice_id: {voice_id} for character: {character}")

        # Optimized timeouts for better reliability and speed
        timeout_config = httpx.Timeout(connect=3.0, read=15.0, write=3.0, pool=3.0)

        with httpx.Client(timeout=timeout_config) as client:
            print(f"🔄 [FALLBACK] Sending request to Fish Audio API...")
            response = client.post(
                'https://api.fish.audio/v1/tts',
                headers={
                    'Authorization': f'Bearer {FISH_AUDIO_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'text': text,
                    'reference_id': voice_id,
                    'format': 'mp3',
                    'latency': 'normal',  # Changed to normal for better speed
                    'normalize': False,
                    'chunk_length': 200   # Increased for better performance
                }
            )

            if response.status_code == 200:
                content = response.content
                if len(content) > 0:
                    print(f"✅ [FALLBACK] Success: {len(content)} bytes")
                    return content
                else:
                    print("❌ [FALLBACK] Empty response")
                    return b''
            else:
                print(f"❌ [FALLBACK] API error {response.status_code}: {response.text}")
                return b''

    except httpx.TimeoutException:
        print("❌ [FALLBACK] Request timeout")
        return b''
    except Exception as e:
        print(f"❌ [FALLBACK] Error: {e}")
        import traceback
        traceback.print_exc()
        return b''

@app.route('/api/voice/tts', methods=['POST'])
def tts_only_endpoint():
    """Lightning-fast TTS-only endpoint with retry logic"""
    try:
        print("📝 [ENDPOINT] Received TTS request")
        start_time = time.time()

        data = request.get_json()
        if not data:
            print("❌ [ENDPOINT] No JSON data received")
            return jsonify({'error': 'Invalid data'}), 400

        character = data.get('character', 'gojo')
        text = data.get('text', '')
        voice_id = data.get('voiceId')

        if not text:
            print("❌ [ENDPOINT] No text provided")
            return jsonify({'error': 'Text required'}), 400

        if not voice_id:
            voice_id = DEFAULT_VOICE_MAPPINGS.get(character)
            if not voice_id:
                print("❌ [ENDPOINT] No voice id provided, and character not found in default mappings")
                return jsonify({'error': 'Voice ID required and character not found'}), 400
            print(f"🔊 [ENDPOINT] Processing TTS for {character} with fallback voice_id: {voice_id}: '{text[:50]}...'")
        else:
            print(f"🔊 [ENDPOINT] Processing TTS for {character} with voice_id: {voice_id}: '{text[:50]}...'")

        # Try with retry logic for better reliability
        response_audio = None
        max_attempts = 2

        for attempt in range(max_attempts):
            try:
                print(f"🔄 [ENDPOINT] Audio generation attempt {attempt + 1}/{max_attempts}")
                response_audio = text_to_speech_lightning_fast(text, character)

                if response_audio and len(response_audio) > 0:
                    break
                else:
                    print(f"⚠️ [ENDPOINT] Attempt {attempt + 1} returned empty audio")
                    if attempt < max_attempts - 1:
                        time.sleep(0.5)  # Short delay before retry

            except Exception as attempt_error:
                print(f"❌ [ENDPOINT] Attempt {attempt + 1} failed: {attempt_error}")
                if attempt < max_attempts - 1:
                    time.sleep(0.5)  # Short delay before retry

        if not response_audio or len(response_audio) == 0:
            print("❌ [ENDPOINT] All audio generation attempts failed")
            return jsonify({'error': 'Audio generation failed after retries'}), 500

        print(f"🔄 [ENDPOINT] Encoding audio to base64...")
        response_audio_base64 = base64.b64encode(response_audio).decode('utf-8')

        total_time = time.time() - start_time
        print(f"✅ [ENDPOINT] TTS success: {len(response_audio_base64)} chars in {total_time:.2f}s")

        return jsonify({
            'audio': f'data:audio/mpeg;base64,{response_audio_base64}',
            'status': 'success'
        })

    except Exception as e:
        print(f"❌ [ENDPOINT] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    print("❤️ [HEALTH] Health check requested")
    return jsonify({'status': 'healthy', 'message': 'TTS-only server ready'})

if __name__ == '__main__':
    print("=== TTS-ONLY Voice Server ===")
    print(f"Fish Audio API: {'***' + FISH_AUDIO_API_KEY[-4:] if FISH_AUDIO_API_KEY else 'NOT SET'}")

    # Initialize TTS services only
    initialize_tts_services()

    print("🚀 Starting TTS-only server on 0.0.0.0:5000...")
    print("📡 Server will be accessible at http://localhost:5000")

    try:
        app.run(host='0.0.0.0', port=5000, debug=False, threaded=True, use_reloader=False)
    except Exception as e:
        print(f"❌ Failed to start TTS server: {e}")
        import traceback
        traceback.print_exc()
