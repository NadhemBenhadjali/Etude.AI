from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uuid
import os

# Import for CORS middleware
from fastapi.middleware.cors import CORSMiddleware

# Assuming elevenlabs_tts is in tts_utils.py, ensure it's in the same directory
from .tts_utils import elevenlabs_tts

app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # CONSIDER CHANGING IN PRODUCTION to your frontend domain (e.g., ["http://localhost:4200", "https://your-frontend-domain.com"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ElevenLabs TTS Configuration and Endpoint ---
# Your ElevenLabs API Key (consider using environment variables for production)
ELEVENLABS_API_KEY = "sk_b4e54ff0deb255a7ff365b52cabfdff0972470acdeb2267e"

class TTSRequest(BaseModel):
    text: str

@app.post("/tts")
async def generate_tts(request: TTSRequest, background_tasks: BackgroundTasks):
    """
    Generates speech from text using ElevenLabs TTS.
    """
    output_filename = "" # Initialize to ensure it's always defined
    try:
        output_filename = f"tts_output_{uuid.uuid4().hex}.mp3"
        elevenlabs_tts(
            text=request.text,
            api_key=ELEVENLABS_API_KEY,
            output_filename=output_filename
        )
        
        # Add the cleanup task to BackgroundTasks
        background_tasks.add_task(os.remove, output_filename)

        return FileResponse(output_filename, media_type="audio/mpeg", filename=output_filename)
    except Exception as e:
        print(f"ElevenLabs TTS Error: {e}")
        # Ensure cleanup even if an error occurs before adding to background tasks
        if output_filename and os.path.exists(output_filename):
            os.remove(output_filename)
        raise HTTPException(status_code=500, detail=f"Failed to generate TTS: {str(e)}")

# Remove STT related startup event as it's no longer needed
@app.on_event("startup")
async def startup_event():
    print("Application starting up... TTS service ready.")
    # No specific startup tasks needed for TTS beyond what's handled by FastAPI itself.