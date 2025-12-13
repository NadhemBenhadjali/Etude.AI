import os
import nest_asyncio, uvicorn
from pyngrok import ngrok, conf
from fastapi import FastAPI
from app.app import app
from app.crew.config import settings

if __name__ == "__main__":
    nest_asyncio.apply()

    # Only run ngrok if token is provided in env
    if settings.NGROK_AUTH_TOKEN:
        os.environ['ngrok_authToken'] = settings.NGROK_AUTH_TOKEN
        conf.get_default().auth_token = settings.NGROK_AUTH_TOKEN
        try:
            public_url = ngrok.connect(8000)
            print("Public URL:", public_url)
        except Exception as e:
            print(f"Ngrok connection failed: {e}")

    uvicorn.run(app, host="0.0.0.0", port=8000)