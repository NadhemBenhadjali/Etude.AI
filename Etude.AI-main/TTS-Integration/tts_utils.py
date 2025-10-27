import requests

def elevenlabs_tts(
    text: str,
    api_key: str,
    voice_id: str = "JjTirzdD7T3GMLkwdd3a",
    model_id: str = "eleven_multilingual_v2",
    stability: float = 0.5,
    similarity_boost: float = 0.75,
    output_filename: str = "tts_output.mp3"
) -> bytes:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": stability,
            "similarity_boost": similarity_boost
        }
    }

    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()

    with open(output_filename, "wb") as f:
        f.write(response.content)

    return response.content
