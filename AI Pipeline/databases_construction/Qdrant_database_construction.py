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
from app.helpers import embed, embed_batch, configure_gemini
from databases_construction.kg_construction import KG

COLLECTION = "etudeai"


def get_kg_metadata_for_page(page_num: int) -> dict:
    """Find branch, topic, and lesson matching the given 1-indexed page number."""
    for branch, topics in KG.items():
        for topic, lessons in topics.items():
            for lesson, (start, end) in lessons.items():
                if start <= page_num <= end:
                    return {
                        "branch": branch,
                        "subject": branch,
                        "topic": topic,
                        "module": topic,
                        "المحور": topic,
                        "lesson": lesson,
                    }
    return {}


def load_json_items(json_path: str) -> list[tuple[str, dict]]:
    items = json.loads(Path(json_path).read_text(encoding="utf-8"))
    out: list[tuple[str, dict]] = []

    for it in items:
        text = (it.get("page_content") or "").strip()
        if not text:
            continue

        payload = {k: v for k, v in it.items() if k != "page_content"}
        meta = payload.pop("metadata", {}) or {}

        # Determine 1-indexed page number
        page_num = meta.get("page", 0) + 1
        if "page_label" in meta:
            try:
                page_num = int(meta["page_label"])
            except Exception:
                pass

        kg_meta = get_kg_metadata_for_page(page_num)

        payload = {
            "text": text,
            "page": page_num,
            **meta,
            **kg_meta,
            **payload,
        }
        out.append((text, payload))

    return out


def recreate_collection_safe(client: QdrantClient, name: str, dim: int) -> None:
    """Recreate collection, handling cases where it may already exist."""
    try:
        exists = False
        try:
            client.get_collection(name)
            exists = True
            print(f"Collection '{name}' already exists, deleting...")
        except Exception:
            exists = False

        if exists:
            try:
                client.delete_collection(name)
                print(f"Deleted existing collection '{name}'")
            except Exception as e:
                print(f"Could not delete collection: {repr(e)}")
                raise
    except Exception as e:
        print(f"collection_exists check failed (continuing): {repr(e)}")

    try:
        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
        )
        print(f"Created collection '{name}' with dimension {dim}")
    except Exception as e:
        if "already exists" in str(e).lower():
            print(f"Collection '{name}' already exists, will use existing collection")
        else:
            raise


def index_payload_fields(client: QdrantClient, name: str) -> None:
    fields = [
        ("page", PayloadSchemaType.INTEGER),
        ("المحور", PayloadSchemaType.KEYWORD),
        ("topic", PayloadSchemaType.KEYWORD),
        ("module", PayloadSchemaType.KEYWORD),
        ("branch", PayloadSchemaType.KEYWORD),
        ("subject", PayloadSchemaType.KEYWORD),
        ("lesson", PayloadSchemaType.KEYWORD),
    ]
    for field_name, schema_type in fields:
        try:
            client.create_payload_index(name, field_name, schema_type)
            print(f"Indexed payload field '{field_name}'")
        except Exception as e:
            if "already exists" not in str(e).lower():
                print(f"Index on '{field_name}': {repr(e)}")


def get_qdrant_client() -> QdrantClient:
    api_key = settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None
    urls = [
        settings.QDRANT_URL,
        "http://qdrant:6333",
        "http://localhost:6333",
    ]
    seen = set()
    unique_urls = [u for u in urls if u and not (u in seen or seen.add(u))]

    for url in unique_urls:
        for key in [api_key, None]:
            try:
                client = QdrantClient(url=url, api_key=key, timeout=10.0, check_compatibility=False)
                client.get_collections()
                print(f"✓ Connected to Qdrant at {url}")
                return client
            except Exception as e:
                if "403" not in str(e) and "api-key" not in str(e).lower():
                    print(f"  Qdrant connection attempt to {url} failed: {e}")
                    break

    return QdrantClient(
        url=settings.QDRANT_URL or "http://localhost:6333",
        api_key=api_key,
        timeout=30.0,
        check_compatibility=False,
    )


def upsert_json(json_path: str, batch_size: int = 16) -> QdrantClient:
    configure_gemini()
    items = load_json_items(json_path)
    if not items:
        raise RuntimeError("No items found in JSON.")

    print(f"Loaded {len(items)} page items from {json_path}. Generating probe embedding...")
    probe_vec = embed(items[0][0])
    dim = len(probe_vec)

    qdrant = get_qdrant_client()
    recreate_collection_safe(qdrant, COLLECTION, dim)

    total_upserted = 0
    print(f"Upserting {len(items)} documents in batches of {batch_size}...")

    for i in range(0, len(items), batch_size):
        chunk = items[i : i + batch_size]
        chunk_texts = [text for text, _ in chunk]
        chunk_payloads = [payload for _, payload in chunk]

        try:
            vectors = embed_batch(chunk_texts, batch_size=batch_size)
            points = [
                PointStruct(id=str(uuid.uuid4()), vector=vec, payload=payload)
                for vec, payload in zip(vectors, chunk_payloads)
            ]
            qdrant.upsert(collection_name=COLLECTION, points=points)
            total_upserted += len(points)
            print(f"   ✓ Upserted {total_upserted}/{len(items)} points...")
        except Exception as e:
            print(f"⚠️ Batch embedding error, falling back to item-by-item: {e}")
            for text, payload in chunk:
                try:
                    vec = embed(text)
                    qdrant.upsert(
                        collection_name=COLLECTION,
                        points=[PointStruct(id=str(uuid.uuid4()), vector=vec, payload=payload)],
                    )
                    total_upserted += 1
                except Exception as item_err:
                    print(f"⚠️ Error embedding page {payload.get('page')}: {item_err}")
                import time
                time.sleep(0.5)

    index_payload_fields(qdrant, COLLECTION)
    return qdrant


def find_json_file() -> str | None:
    base_dir = Path(__file__).resolve().parent
    candidates = [
        os.getenv("JSON_PATH", ""),
        str(base_dir.parent / "config_files" / "Book.pdf.json"),
        str(base_dir.parent / "config_files" / "Book_with_axes.json"),
        "config_files/Book.pdf.json",
        "config_files/Book_with_axes.json",
        "config_files/ktebjson/Book.pdf.json",
    ]
    return next((p for p in candidates if p and os.path.exists(p)), None)


def search_example(qdrant: QdrantClient) -> None:
    configure_gemini()

    query = "الوقاية من أمراض العين"
    qvec = embed(query)

    flt = Filter(
        must=[
            FieldCondition(key="المحور", match=MatchValue(value="الحواس")),
            FieldCondition(key="page", range=Range(gte=5, lte=50)),
        ]
    )

    hits = qdrant.search(
        collection_name=COLLECTION,
        query_vector=qvec,
        with_payload=True,
        limit=5,
        score_threshold=0.35,
        query_filter=flt,
    )

    for h in hits:
        p = h.payload or {}
        print(
            f"score={h.score:.3f} page={p.get('page')} المحور={p.get('المحور')}\n"
            f"{(p.get('text') or '')[:220]}...\n"
        )


if __name__ == "__main__":
    json_path = find_json_file()
    if not json_path:
        raise FileNotFoundError("Book.pdf.json or Book_with_axes.json not found. Set JSON_PATH.")

    print(f"Using JSON file: {json_path}")
    qdrant = upsert_json(json_path)
    print("Upsert complete.")
    try:
        search_example(qdrant)
    except Exception as e:
        print(f"Search example note: {e}")
