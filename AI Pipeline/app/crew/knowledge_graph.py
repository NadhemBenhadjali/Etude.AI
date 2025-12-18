from neo4j import GraphDatabase
from typing import List
import structlog
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from neo4j.exceptions import ServiceUnavailable, TransientError
from app.exceptions import Neo4jConnectionError

logger = structlog.get_logger()

# Import circuit breaker (lazy to avoid circular imports)
_neo4j_circuit = None

def _get_neo4j_circuit():
    """Lazy initialization of Neo4j circuit breaker."""
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
        """
        Initialize Neo4j connection with proper pooling configuration.

        Args:
            uri: Neo4j connection URI
            user: Username
            pwd: Password
        """
        self.uri = uri
        self.user = user
        self.pwd = pwd
        self._driver = None
        self._connection_verified = False

    @property
    def driver(self):
        """Lazy initialization of Neo4j driver."""
        if self._driver is None:
            try:
                self._driver = GraphDatabase.driver(
                    self.uri,
                    auth=(self.user, self.pwd),
                    max_connection_pool_size=50,
                    connection_acquisition_timeout=10.0,  # 10 seconds
                    max_transaction_retry_time=10.0,
                )
                # Verify connectivity on first access
                if not self._connection_verified:
                    self._driver.verify_connectivity()
                    self._connection_verified = True
                    logger.info("neo4j_connected", uri=self.uri)
            except Exception as e:
                logger.error("neo4j_connection_failed", uri=self.uri, error=str(e))
                raise
        return self._driver

    def close(self):
        """Close the Neo4j driver connection."""
        if self._driver:
            self._driver.close()
            logger.info("neo4j_connection_closed")
            self._driver = None
            self._connection_verified = False

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        retry=retry_if_exception_type((ServiceUnavailable, TransientError)),
        reraise=True,
    )
    def get_lessons_for_topic(self, topic_name: str) -> list[dict]:
        """
        Returns a list of dicts:
          [{ 'title': <string>, 'start_page': <int>, 'end_page': <int> }, …]

        Raises:
            Neo4jConnectionError: If Neo4j connection fails
        """
        query = """
        MATCH (t:Topic {name: $topic_name})-[:HAS_LESSON]->(l:Lesson)
        RETURN l.title AS title, l.start_page AS start_page, l.end_page AS end_page
        ORDER BY l.title
        """

        def _execute_query():
            try:
                with self.driver.session() as session:
                    result = session.run(query, topic_name=topic_name)
                    lessons = [record.data() for record in result]
                    logger.debug("lessons_fetched", topic=topic_name, count=len(lessons))
                    return lessons
            except (ServiceUnavailable, TransientError) as e:
                logger.error("neo4j_transient_error", topic=topic_name, error=str(e))
                raise
            except Exception as e:
                error_str = str(e)
                if "DNS resolve" in error_str or "Name or service not known" in error_str or "connection" in error_str.lower():
                    logger.error("neo4j_connection_failed", topic=topic_name, error=error_str)
                    raise Neo4jConnectionError(
                        f"Failed to connect to Neo4j database: {error_str}",
                        details={"topic": topic_name, "error": error_str}
                    )
                logger.error("get_lessons_failed", topic=topic_name, error=error_str)
                raise

        circuit = _get_neo4j_circuit()
        if circuit:
            try:
                return circuit.call(_execute_query)
            except Exception as e:
                if "CircuitBreakerOpen" in str(type(e)):
                    raise Neo4jConnectionError(
                        "Neo4j service is temporarily unavailable (circuit breaker open)",
                        details={"service": "neo4j", "state": "circuit_open"}
                    )
                raise
        else:
            return _execute_query()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        retry=retry_if_exception_type((ServiceUnavailable, TransientError)),
        reraise=True,
    )
    def find_branch_for_topic(self, topic_name: str) -> str | None:
        """
        Returns the parent Branch name of a given topic, or None if not found.

        Raises:
            Neo4jConnectionError: If Neo4j connection fails (DNS, network, etc.)
        """
        query = """
        MATCH (b:Branch)-[:HAS_TOPIC]->(t:Topic {name: $topic_name})
        RETURN b.name AS branch_name
        """

        def _execute_query():
            try:
                with self.driver.session() as session:
                    rec = session.run(query, topic_name=topic_name).single()
                    branch = rec["branch_name"] if rec else None
                    logger.debug("branch_found", topic=topic_name, branch=branch)
                    return branch
            except (ServiceUnavailable, TransientError) as e:
                logger.error("neo4j_transient_error", topic=topic_name, error=str(e))
                raise
            except Exception as e:
                error_str = str(e)
                # Check for DNS/network errors
                if "DNS resolve" in error_str or "Name or service not known" in error_str or "connection" in error_str.lower():
                    logger.error("neo4j_connection_failed", topic=topic_name, error=error_str)
                    raise Neo4jConnectionError(
                        f"Failed to connect to Neo4j database: {error_str}",
                        details={
                            "topic": topic_name,
                            "error": error_str,
                            "uri": self.uri
                        }
                    )
                logger.error("find_branch_failed", topic=topic_name, error=error_str)
                raise

        # Use circuit breaker if available
        circuit = _get_neo4j_circuit()
        if circuit:
            try:
                return circuit.call(_execute_query)
            except Exception as e:
                # Circuit breaker exceptions or original exceptions
                if "CircuitBreakerOpen" in str(type(e)):
                    raise Neo4jConnectionError(
                        "Neo4j service is temporarily unavailable (circuit breaker open)",
                        details={"service": "neo4j", "state": "circuit_open"}
                    )
                raise
        else:
            return _execute_query()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        retry=retry_if_exception_type((ServiceUnavailable, TransientError)),
        reraise=True,
    )
    def list_all_topics(self) -> list[str]:
        """
        Returns the list of all topic names currently in the KG.
        """
        query = "MATCH (t:Topic) RETURN t.name AS name ORDER BY t.name"
        try:
            with self.driver.session() as session:
                result = session.run(query)
                topics = [record["name"] for record in result]
                logger.debug("topics_listed", count=len(topics))
                return topics
        except Exception as e:
            logger.error("list_topics_failed", error=str(e))
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        retry=retry_if_exception_type((ServiceUnavailable, TransientError)),
        reraise=True,
    )
    def fetch_all_lesson_embeddings(self) -> list[dict]:
        """
        Return a list of dicts, each containing:
          - 'topic': parent topic name
          - 'lesson': lesson title
          - 'embedding': the stored vector_embedding (list of floats)
        """
        cypher = """
        MATCH (t:Topic)-[:HAS_LESSON]->(l:Lesson)
        WHERE l.vector_embedding IS NOT NULL
        RETURN t.name AS topic, l.title AS lesson, l.vector_embedding AS embedding
        """
        try:
            with self.driver.session() as session:
                records = session.run(cypher)
                embeddings = [record.data() for record in records]
                logger.debug("embeddings_fetched", count=len(embeddings))
                return embeddings
        except Exception as e:
            logger.error("fetch_embeddings_failed", error=str(e))
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        retry=retry_if_exception_type((ServiceUnavailable, TransientError)),
        reraise=True,
    )
    def fetch_lesson_images(self, lesson_title: str) -> list[dict]:
        """
        Return every Image attached to a Lesson via
        (l:Lesson)-[:HAS_IMAGE]->(img:Image).
        Each row is a dict with keys: file, caption, page.
        """
        cypher = """
        MATCH (l:Lesson {title: $title})-[:HAS_IMAGE]->(img:Image)
        RETURN img.name    AS name,
            img.caption AS caption,
            img.page    AS page
        ORDER BY img.page
        """
        try:
            with self.driver.session() as session:
                images = session.run(cypher, title=lesson_title).data()
                logger.debug("images_fetched", lesson=lesson_title, count=len(images))
                return images
        except Exception as e:
            logger.error("fetch_images_failed", lesson=lesson_title, error=str(e))
            raise
    def extract_images(self, topic: str) -> str:
        """
        Builds a markdown block listing images grouped by lesson for the given topic.
        Returns a single markdown string.
        """
        lessons = self.get_lessons_for_topic(topic)
        images_blocks: List[str] = []
        for ld in lessons:
            pics = self.fetch_lesson_images(ld["title"])
            if pics:
                md = "\n".join(f"* [{p['caption']}]({p['name']})" for p in pics)
                images_blocks.append(f"درس «{ld['title']}» – التصاور:\n{md}\n")
        return "\n".join(images_blocks) if images_blocks else "ما ثـمّـة حتى تصاور."

