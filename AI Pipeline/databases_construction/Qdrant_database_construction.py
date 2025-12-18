import os
import json
import uuid
from pathlib import Path


from qdrant_client import QdrantClient
from qdrant_client.models import (
    PointStruct,
    Distance,
    VectorParams,
    PayloadSchemaType,
    Filter,
    FieldCondition,
    MatchValue,
    Range,
)

# change this import to your actual module path
from app.crew.config import settings
from app.helpers import embed, configure_gemini

COLLECTION = "etudeai"





def load_json_items(json_path: str) -> list[tuple[str, dict]]:
    items = json.loads(Path(json_path).read_text(encoding="utf-8"))
    out: list[tuple[str, dict]] = []

    for it in items:
        text = (it.get("page_content") or "").strip()
        if not text:
            continue

        payload = {k: v for k, v in it.items() if k != "page_content"}
        meta = payload.pop("metadata", {}) or {}
        payload = {"text": text, **meta, **payload}
        out.append((text, payload))

    return out


def recreate_collection_safe(client: QdrantClient, name: str, dim: int) -> None:
    try:
        if client.collection_exists(name):
            client.delete_collection(name)
    except Exception as e:
        print("collection_exists check failed (continuing):", repr(e))

    client.create_collection(
        collection_name=name,
        vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
    )


def index_payload_fields(client: QdrantClient, name: str) -> None:
    try:
        client.create_payload_index(name, "page", PayloadSchemaType.INTEGER)
    except Exception as e:
        print("page index:", repr(e))

    try:
        client.create_payload_index(name, "المحور", PayloadSchemaType.KEYWORD)
    except Exception as e:
        print("المحور index:", repr(e))


def get_qdrant_client() -> QdrantClient:
    if not settings.QDRANT_URL or not settings.QDRANT_API_KEY:
        raise RuntimeError("QDRANT_URL or QDRANT_API_KEY missing in .env")

    return QdrantClient(
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY,
        timeout=15.0,
    )


def upsert_json(json_path: str, batch_size: int = 64) -> QdrantClient:
    configure_gemini()
    items = load_json_items(json_path)
    if not items:
        raise RuntimeError("No items found in JSON.")

    probe_vec = embed(items[0][0])
    dim = len(probe_vec)

    qdrant = get_qdrant_client()
    recreate_collection_safe(qdrant, COLLECTION, dim)

    batch: list[PointStruct] = []
    for text, payload in items:
        vec = embed(text)
        batch.append(PointStruct(id=str(uuid.uuid4()), vector=vec, payload=payload))

        if len(batch) >= batch_size:
            qdrant.upsert(collection_name=COLLECTION, points=batch)
            batch = []

    if batch:
        qdrant.upsert(collection_name=COLLECTION, points=batch)

    index_payload_fields(qdrant, COLLECTION)
    return qdrant


def search_example(qdrant: QdrantClient) -> None:
    configure_gemini()

    query = "الوقاية من أمراض العين"
    qvec = embed(query)

    flt = Filter(
        must=[
            FieldCondition(key="المحور", match=MatchValue(value="الإبصار")),
            FieldCondition(key="page", range=Range(gte=5, lte=50)),
        ]
    )

    hits = qdrant.search(
        collection_name=COLLECTION,
        query_vector=qvec,
        with_payload=True,
        limit=5,
        score_threshold=0.35,
        query_filter=flt,  # set None to search all
    )

    for h in hits:
        p = h.payload or {}
        print(
            f"score={h.score:.3f} page={p.get('page')} المحور={p.get('المحور')}\n"
            f"{(p.get('text') or '')[:220]}...\n"
        )


if __name__ == "__main__":
    candidates = [
        os.getenv("JSON_PATH", ""),
        "config_files/Book_with_axes.json",
        "/mnt/data/Book_with_axes.json",
    ]
    json_path = next((p for p in candidates if p and os.path.exists(p)), None)
    if not json_path:
        raise FileNotFoundError("Book_with_axes.json not found. Set JSON_PATH.")

    qdrant = upsert_json(json_path)
    print("Upsert complete.")
    search_example(qdrant)
