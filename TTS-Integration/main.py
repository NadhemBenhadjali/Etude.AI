from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uuid
import os

# Import for CORS middleware
from fastapi.middleware.cors import CORSMiddleware
from .tts_utils import elevenlabs_tts

app = FastAPI()

# --- CORS Middleware ---
# Use environment variable for origins in production
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ElevenLabs Configuration ---
# Retrieved from Environment
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")


class TTSRequest(BaseModel):
    text: str


@app.post("/tts")
async def generate_tts(request: TTSRequest, background_tasks: BackgroundTasks):
    """
    Generates speech from text using ElevenLabs TTS.
    """
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="Server Error: ElevenLabs API Key not configured.")

    output_filename = ""
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
        if output_filename and os.path.exists(output_filename):
            os.remove(output_filename)
        raise HTTPException(status_code=500, detail=f"Failed to generate TTS: {str(e)}")


@app.on_event("startup")
async def startup_event():
    print("Application starting up... TTS service ready.")