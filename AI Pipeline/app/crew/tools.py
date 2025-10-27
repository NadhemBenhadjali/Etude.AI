from crewai_tools import QdrantVectorSearchTool
import os
import google.generativeai as genai

def configure_gemini():
    genai.configure(os.getenv("GEMINI_API_KEY"))

def embed(text: str):
    res = genai.embed_content(model="text-embedding-004", content=text)
    emb = res.get("embedding")
    return emb["values"] if isinstance(emb, dict) and "values" in emb else emb

qdrant_tool = QdrantVectorSearchTool(
    qdrant_url=os.getenv("QDRANT_URL"),
    qdrant_api_key=os.getenv("QDRANT_API_KEY"),
    collection_name="etudeai",
    limit=5,
    score_threshold=0.35,
    custom_embedding_fn=embed
)
