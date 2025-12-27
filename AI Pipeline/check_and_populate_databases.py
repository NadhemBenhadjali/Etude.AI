"""
Check if Neo4j and Qdrant databases have data, and populate them if empty.
Run this after migrating to Docker to ensure databases are ready.
"""
import sys
import subprocess
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.crew.config import settings
from app.crew.knowledge_graph import Neo4jKG
from qdrant_client import QdrantClient
import structlog

logger = structlog.get_logger()


def check_neo4j_data() -> bool:
    """Check if Neo4j has data."""
    logger.info("checking_neo4j", uri=settings.NEO4J_URI)

    try:
        kg = Neo4jKG(
            uri=settings.NEO4J_URI,
            user=settings.NEO4J_USER,
            pwd=settings.NEO4J_PASSWORD
        )

        # Check if we have any lessons
        with kg.driver.session() as session:
            result = session.run("MATCH (l:Lesson) RETURN count(l) as count")
            count = result.single()["count"]

        kg.close()

        if count > 0:
            logger.info("neo4j_has_data", lesson_count=count)
            return True
        else:
            logger.warning("neo4j_empty", lesson_count=0)
            return False

    except Exception as e:
        logger.error("neo4j_check_failed", error=str(e))
        return False
        return False


def check_qdrant_data() -> bool:
    """Check if Qdrant has data."""
    logger.info("checking_qdrant", url=settings.QDRANT_URL)

    try:
        # API key is optional for local Docker
        api_key = settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None

        client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=api_key,
            timeout=15
        )

        collection_name = "etudeai"

        # Try to get collection info - if it fails, collection doesn't exist
        try:
            info = client.get_collection(collection_name)
            count = info.points_count

            if count > 0:
                logger.info("qdrant_has_data", point_count=count)
                return True
            else:
                logger.warning("qdrant_empty", point_count=0)
                return False
        except Exception as inner_e:
            # Collection doesn't exist or can't be accessed
            logger.warning("qdrant_collection_not_found", error=str(inner_e))
            return False

    except Exception as e:
        logger.error("qdrant_check_failed", error=str(e))
        return False


def populate_neo4j():
    """Populate Neo4j with knowledge graph data."""
    logger.info("populating_neo4j")
    print("   📊 Building Neo4j knowledge graph...")

    try:
        # Import and run kg_construction
        from databases_construction.kg_construction import main as build_kg
        build_kg()
        logger.info("neo4j_populated")
        print("   ✅ Neo4j populated successfully!")
        return True
    except Exception as e:
        logger.error("neo4j_population_failed", error=str(e))
        print(f"   ❌ Failed to populate Neo4j: {str(e)}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()[-500:]}")
        return False


def populate_qdrant():
    """Populate Qdrant with vector data."""
    logger.info("populating_qdrant")
    print("   📊 Building Qdrant vector database...")

    try:
        # Import and run Qdrant_database_construction
        import os
        from databases_construction.Qdrant_database_construction import upsert_json

        # Find the JSON file
        candidates = [
            os.getenv("JSON_PATH", ""),
            "config_files/Book_with_axes.json",
            "config_files/ktebjson/Book.pdf.json",
        ]
        json_path = next((p for p in candidates if p and os.path.exists(p)), None)

        if not json_path:
            logger.error("json_file_not_found", candidates=candidates)
            print(f"   ❌ JSON file not found. Checked: {candidates}")
            return False

        logger.info("using_json_file", path=json_path)
        print(f"   📄 Using JSON file: {json_path}")

        upsert_json(json_path)
        logger.info("qdrant_populated")
        print("   ✅ Qdrant populated successfully!")
        return True

    except Exception as e:
        logger.error("qdrant_population_failed", error=str(e))
        print(f"   ❌ Failed to populate Qdrant: {str(e)}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()[-500:]}")
        return False


def main():
    """Main function to check and populate databases."""
    logger.info("database_check_started")

    print("\n" + "="*60)
    print("Database Population Check")
    print("="*60 + "\n")

    # Check Neo4j
    print("1. Checking Neo4j...")
    neo4j_has_data = check_neo4j_data()

    if not neo4j_has_data:
        print("   ⚠️  Neo4j is empty. Populating...")
        if populate_neo4j():
            print("   ✅ Neo4j populated successfully!")
        else:
            print("   ❌ Failed to populate Neo4j")
            return 1
    else:
        print("   ✅ Neo4j already has data")

    print()

    # Check Qdrant
    print("2. Checking Qdrant...")
    qdrant_has_data = check_qdrant_data()

    if not qdrant_has_data:
        print("   ⚠️  Qdrant is empty. Populating...")
        if populate_qdrant():
            print("   ✅ Qdrant populated successfully!")
        else:
            print("   ❌ Failed to populate Qdrant")
            return 1
    else:
        print("   ✅ Qdrant already has data")

    print()
    print("="*60)
    print("Database check complete!")
    print("="*60)

    return 0


if __name__ == "__main__":
    sys.exit(main())

