import nest_asyncio, uvicorn
from fastapi import FastAPI
from app.app import app

if __name__ == "__main__":
    nest_asyncio.apply()

    uvicorn.run(app, host="0.0.0.0", port=8000)
