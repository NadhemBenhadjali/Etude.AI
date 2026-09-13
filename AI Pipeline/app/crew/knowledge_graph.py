from neo4j import GraphDatabase
from typing import List, Any
import structlog
from neo4j.exceptions import ServiceUnavailable, TransientError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.exceptions import Neo4jConnectionError

logger = structlog.get_logger()
_neo4j_circuit = None


def _get_neo4j_circuit() -> Any:
    global _neo4j_circuit
    if _neo4j_circuit is None:
        try:
            from app.circuit_breaker import neo4j_circuit
            _neo4j_circuit = neo4j_circuit
        except Exception as e:
            logger.warning("neo4j_circuit_breaker_unavailable", error=str(e))
    return _neo4j_circuit


class Neo4jKG:
    def __init__(self, uri: str, user: str, pwd: str):
        self.uri = uri
        self.user = user
        self.pwd = pwd
        self._driver = None
        self._connection_verified = False

    @property
    def driver(self):
        if self._driver is None:
            uris = [
                self.uri,
                "bolt://neo4j:7687",
                "bolt://localhost:7687",
                "neo4j://localhost:7687",
            ]
            seen = set()
            unique_uris = [u for u in uris if u and not (u in seen or seen.add(u))]

            last_err = None
            for uri in unique_uris:
                try:
                    candidate = GraphDatabase.driver(
                        uri,
                        auth=(self.user, self.pwd),
                        max_connection_pool_size=50,
                        connection_acquisition_timeout=10.0,
                        max_transaction_retry_time=10.0,
                    )
                    candidate.verify_connectivity()
                    self._driver = candidate
                    self._connection_verified = True
                    logger.info("neo4j_connected", uri=uri)
                    return self._driver
                except Exception as e:
                    last_err = e
                    logger.warning("neo4j_connection_attempt_failed", uri=uri, error=str(e))

            logger.error("neo4j_all_connections_failed", error=str(last_err))
            raise last_err
        return self._driver

    def close(self):
        if self._driver:
            self._driver.close()
            logger.info("neo4j_connection_closed")
            self._driver = None
            self._connection_verified = False

    # ------------------------------------------------------------------
    # Internal Execution Engine (Handles Retries, Circuit Breaker & Errors)
    # ------------------------------------------------------------------

    @retry(
        stop=stop_after_attempt(3), # type: ignore
        wait=wait_exponential(multiplier=1, min=1, max=5),# type: ignore
        retry=retry_if_exception_type((ServiceUnavailable, TransientError)),# type: ignore
        reraise=True,
    )
    def _raw_execute_read(self, query: str, **kwargs) -> list[dict]:
        """Runs the query inside a session and returns a list of dictionaries."""
        try:
            with self.driver.session() as session:
                result = session.run(query, **kwargs)
                return [record.data() for record in result]
        except (ServiceUnavailable, TransientError) as e:
            logger.error("neo4j_transient_error", query=query, error=str(e))
            raise
        except Exception as e:
            error_str = str(e)
            if any(k in error_str.lower() for k in ["dns resolve", "name or service not known", "connection"]):
                logger.error("neo4j_connection_failed", query=query, error=error_str)
                raise Neo4jConnectionError(
                    f"Failed to connect to Neo4j database: {error_str}",
                    details={"query": query, "error": error_str, "uri": self.uri}
                )
            logger.error("neo4j_query_failed", query=query, error=error_str)
            raise

    def execute_read_query(self, query: str, **kwargs) -> list[dict]:
        """Wrapper that executes queries with Circuit Breaker protection."""
        circuit = _get_neo4j_circuit()
        if circuit is not None:
            try:
                return circuit.call(self._raw_execute_read, query, **kwargs)
            except Exception as e:
                # Fixed: Use __class__.__name__ instead of str(type(e))
                if "CircuitBreakerOpen" in e.__class__.__name__:
                    raise Neo4jConnectionError(
                        "Neo4j service is temporarily unavailable (circuit breaker open)",
                        details={"service": "neo4j", "state": "circuit_open"}
                    )
                raise
        return self._raw_execute_read(query, **kwargs)

    # ------------------------------------------------------------------
    # Clean Public Business Methods
    # ------------------------------------------------------------------

    def find_branch_for_topic(self, topic_name: str) -> str | None:
        query = """
        MATCH (b:Branch)-[:HAS_TOPIC]->(t:Topic {name: $topic_name})
        RETURN b.name AS branch_name
        """
        records = self.execute_read_query(query, topic_name=topic_name)
        branch = records[0]["branch_name"] if records else None
        logger.debug("branch_found", topic=topic_name, branch=branch)
        return branch

    def get_lessons_for_topic(self, topic_name: str) -> list[dict]:
        query = """
        MATCH (t:Topic {name: $topic_name})-[:HAS_LESSON]->(l:Lesson)
        RETURN l.title AS title, l.start_page AS start_page, l.end_page AS end_page
        ORDER BY l.title
        """
        lessons = self.execute_read_query(query, topic_name=topic_name)
        logger.debug("lessons_fetched", topic=topic_name, count=len(lessons))
        return lessons

    def list_all_topics(self) -> list[str]:
        query = "MATCH (t:Topic) RETURN t.name AS name ORDER BY t.name"
        records = self.execute_read_query(query)
        topics = [r["name"] for r in records]
        logger.debug("topics_listed", count=len(topics))
        return topics

    def fetch_all_lesson_embeddings(self) -> list[dict]:
        cypher = """
        MATCH (t:Topic)-[:HAS_LESSON]->(l:Lesson)
        WHERE l.vector_embedding IS NOT NULL
        RETURN t.name AS topic, l.title AS lesson, l.vector_embedding AS embedding
        """
        embeddings = self.execute_read_query(cypher)
        logger.debug("embeddings_fetched", count=len(embeddings))
        return embeddings

    def fetch_lesson_images(self, lesson_title: str) -> list[dict]:
        cypher = """
        MATCH (l:Lesson {title: $title})-[:HAS_IMAGE]->(img:Image)
        RETURN img.name    AS name,
               img.caption AS caption,
               img.page    AS page
        ORDER BY img.page
        """
        images = self.execute_read_query(cypher, title=lesson_title)
        logger.debug("images_fetched", lesson=lesson_title, count=len(images))
        return images

    def extract_images(self, topic: str) -> str:
        lessons = self.get_lessons_for_topic(topic)
        images_blocks: List[str] = []
        for ld in lessons:
            pics = self.fetch_lesson_images(ld["title"])
            if pics:
                md = "\n".join(f"* [{p['caption']}](assets/book_images/{p['name']})" for p in pics)
                images_blocks.append(f"درس «{ld['title']}» – التصاور:\n{md}\n")
        return "\n".join(images_blocks) if images_blocks else "ما ثـمّـة حتى تصاور."