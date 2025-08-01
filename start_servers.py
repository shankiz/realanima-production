import subprocess
import threading
import time
import os
import sys

def run_nextjs():
    """Run the Next.js development server"""
    print("=== Starting Next.js development server ===")
    try:
        process = subprocess.Popen(
            ["npm", "run", "dev"], 
            cwd=".",
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )

        # Stream output in real-time with prefixes
        for line in iter(process.stdout.readline, ''):
            print(f"[NEXT] {line.rstrip()}")

        process.wait()
        print(f"[NEXT] Server exited with code: {process.returncode}")

    except Exception as e:
        print(f"Error starting Next.js server: {e}")
        import traceback
        traceback.print_exc()

def run_voice_server():
    """Run the Python voice server"""
    print("=== Starting Python voice server ===")
    try:
        # Use Python directly without additional delays
        python_cmd = sys.executable
        print(f"Using Python: {python_cmd}")

        # Check if voice_server.py exists
        if not os.path.exists("voice_server.py"):
            print("ERROR: voice_server.py not found!")
            return

        # Set environment variables
        env = os.environ.copy()
        env['PYTHONPATH'] = '.'
        env['FLASK_ENV'] = 'development'
        env['PYTHONUNBUFFERED'] = '1'  # Force unbuffered output

        # Run the voice server with immediate output
        process = subprocess.Popen(
            [python_cmd, "-u", "voice_server.py"], 
            cwd=".", 
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=0,  # Unbuffered
            universal_newlines=True
        )

        # Stream output in real-time with prefixes
        for line in iter(process.stdout.readline, ''):
            if line.strip():
                print(f"[VOICE] {line.rstrip()}")

        process.wait()
        print(f"[VOICE] Server exited with code: {process.returncode}")

    except Exception as e:
        print(f"Error starting Python voice server: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Starting all servers...")

    # Start both servers in parallel using threads
    nextjs_thread = threading.Thread(target=run_nextjs, daemon=True)
    voice_thread = threading.Thread(target=run_voice_server, daemon=True)

    # Start Next.js first
    nextjs_thread.start()

    # Give Next.js a moment to start, then start voice server
    time.sleep(2)
    voice_thread.start()

    try:
        # Keep main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down servers...")
        sys.exit(0)