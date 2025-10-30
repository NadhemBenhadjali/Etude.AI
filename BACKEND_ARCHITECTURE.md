# Etude.AI Backend Architecture (Spring Boot + Kafka + Docker)

This document proposes a stable, production-ready backend architecture for Etude.AI using Spring Boot, Docker, and Apache Kafka to orchestrate information flow between agents and services. It includes user moderation with three roles (Student, Parent, Admin), management features, persistence, and event-driven integrations with the existing Python agent pipeline.

---

## Goals

- Role-based user moderation: Student, Parent, Admin
- Reliable information exchange between services and Python agents via Kafka
- Strong persistence and audits for compliance and traceability
- Scalable and observable microservices with clear boundaries
- Containerized development and deployment with Docker/Compose

---

## High-Level Architecture

- API Gateway (Spring Cloud Gateway)
- AuthN/Z using Keycloak (recommended) or Spring Authorization Server + JWT
- Core Services (Spring Boot 3.3+, Java 21):
  - Users Service: accounts, roles, parent-student linkage, profile management
  - Content Service: lessons, assignments, generated PDFs/images metadata
  - Agent Orchestrator Service: request/response coordination with agent workers via Kafka
  - Moderation Service: content flags, parental controls, admin review workflows
  - Notifications Service: WebSocket push, email/SMS events, status updates
  - File Service: PDF/image storage via S3-compatible object store (MinIO)
- Data Plane:
  - PostgreSQL for relational data (users, roles, links, content metadata)
  - Redis for caching, rate limits, ephemeral tokens
  - Kafka (+ Schema Registry) for event-driven communication
  - MinIO (S3) for artifacts (PDFs, images, audio)
- Observability:
  - Prometheus + Grafana (metrics), Loki (logs), OpenTelemetry Collector + Jaeger/Tempo (traces)

Python agents (existing) interact predominantly through Kafka to decouple languages and runtimes.

---

## Services and Responsibilities

- API Gateway
  - Routing, TLS termination, CORS, request size limits
  - Rate limiting and auth forwarding to services

- Auth (Keycloak)
  - Realm: `etude-ai`
  - Clients: `gateway`, `webapp`, `mobile`
  - Roles: `ROLE_STUDENT`, `ROLE_PARENT`, `ROLE_ADMIN`
  - Groups or attributes for parent-student relationships
  - Optional alternative: Spring Authorization Server + Spring Security JWT

- Users Service
  - User registration/onboarding, linking Student↔Parent
  - Role assignment (admin-only), profile updates
  - Exposes `GET /users/me`, `POST /users/link-child`, `GET /users/{id}`

- Content Service
  - Track lessons, chapters, assignments, generated report artifacts
  - Save OCR-extracted text, agent results metadata
  - Search integration (optional: OpenSearch/Elasticsearch)

- Agent Orchestrator Service
  - Accepts requests from UI/API (e.g., summarize, quiz generation, Q&A)
  - Publishes tasks to Kafka topics for Python agents
  - Correlates results, updates DB, emits Notifications events
  - Idempotency and retries with outbox pattern

- Moderation Service
  - Flagging pipeline for content/messages/results
  - Parent controls: allowed topics, daily limits, activity reports
  - Admin review queue, policy rules

- Notifications Service
  - WebSocket (STOMP) updates to clients
  - Email/SMS via provider integrations

- File Service
  - Upload/download to S3 (MinIO), signed URLs
  - Virus scanning hook (optional: ClamAV container)

---

## Data Model (Core)

- User(id, email, password_hash or external_idp_id, roles[])
- ParentChildLink(parent_id, student_id, created_at)
- StudentProfile(user_id, grade_level, preferences)
- ContentItem(id, type, title, metadata JSONB, owner_id)
- AgentSession(id, user_id, context JSONB, created_at)
- AgentTask(id, session_id, type, payload JSONB, correlation_id, status, created_at)
- AgentResult(id, task_id, result JSONB, error, created_at)
- ModerationFlag(id, subject_type, subject_id, reason, status, raised_by, created_at)
- Notification(id, user_id, type, payload JSONB, delivered_at)

Use PostgreSQL JSONB for agent payloads/results to remain flexible.

---

## Messaging with Kafka

- Broker: Kafka (KRaft) or Redpanda
- Schema: Avro (recommended) with Schema Registry
- Serialization: Confluent Avro or Protobuf; prefer Avro for JSON-like payloads
- Consumer semantics: at-least-once with idempotency keys; deduplicate by `correlationId`
- Headers: `correlationId`, `causationId`, `sessionId`, `userId`, `roles`, `schemaVersion`

Topics (suggested):
- `agents.task.request.v1` — produced by Agent Orchestrator; consumed by Python agents
- `agents.task.result.v1` — produced by Python agents; consumed by Agent Orchestrator
- `moderation.events.v1` — content flagged/approved/blocked events
- `notifications.events.v1` — fan-out for user notifications
- `pdf.render.request.v1` / `pdf.render.result.v1` — for PDF jobs
- `ocr.request.v1` / `ocr.result.v1` — for OCR jobs

Avro example (task request):
```avro
{
  "type": "record",
  "name": "AgentTaskRequest",
  "namespace": "ai.etude.events",
  "fields": [
    {"name": "correlationId", "type": "string"},
    {"name": "sessionId", "type": "string"},
    {"name": "userId", "type": "string"},
    {"name": "taskType", "type": {"type": "enum", "name": "TaskType", "symbols": ["SUMMARY", "QUIZ", "QA", "OCR", "PDF"]}},
    {"name": "payload", "type": "string"},  // JSON string
    {"name": "timestamp", "type": "long"}
  ]
}
```

---

## Security and Moderation

- Authentication: Keycloak-issued JWTs; Gateway and services validate via JWKS
- Authorization:
  - Role checks with Spring Security annotations, e.g., `@PreAuthorize("hasRole('ADMIN')")`
  - Attribute checks for parent access: Parent can only access linked students
- Parental controls: content filters, usage caps, oversight dashboards
- Audit trail: persist sensitive actions (role change, moderation decision)
- Rate limiting: Redis-backed (Gateway) using Bucket4j/Spring Cloud Gateway filter
- Secrets: use Docker secrets / Kubernetes secrets; never commit to repo

---

## Service APIs (Sketch)

- Users Service (WebMVC)
  - `GET /users/me` — current profile
  - `POST /users/link-child { childEmail }` — parent links student
  - `GET /users/{id}` (admin) — view user details
  - `POST /users/{id}/roles` (admin) — update roles

- Agent Orchestrator (WebMVC or WebFlux)
  - `POST /agent-requests` — create task (summary/quiz/qa)
  - `GET /agent-results/{taskId}` — fetch result

- Moderation (WebMVC)
  - `POST /flags` — raise a flag
  - `POST /flags/{id}/resolve` (admin)

- Notifications (WebSocket + REST)
  - `/ws` endpoint; `SUB /topic/user.{userId}`

- Content Service (WebMVC)
  - `GET /contents?ownerId=...`
  - `POST /contents` (metadata) and signed upload URL from File Service

OpenAPI/Swagger for all services via springdoc.

---

## Spring Boot Dependencies

Target: Spring Boot 3.3+, Java 21. Below are Maven coordinates (Gradle analogous).

Core (common to most services):
- `org.springframework.boot:spring-boot-starter-web`
- `org.springframework.boot:spring-boot-starter-validation`
- `org.springframework.boot:spring-boot-starter-security`
- `org.springframework.boot:spring-boot-starter-oauth2-resource-server`
- `org.springframework.boot:spring-boot-starter-actuator`
- `org.springdoc:springdoc-openapi-starter-webmvc-ui:2.5.0`
- `org.springframework.boot:spring-boot-starter-cache`
- `org.springframework.boot:spring-boot-starter-mail` (Notifications service)
- `io.github.resilience4j:resilience4j-spring-boot3`
- `org.mapstruct:mapstruct:1.6.3` (optional) and `mapstruct-processor` for mapping
- `org.projectlombok:lombok` (optional; prefer records when possible)

Data:
- `org.springframework.boot:spring-boot-starter-data-jpa` (blocking)
- `org.postgresql:postgresql`
- `org.flywaydb:flyway-core` (or Liquibase) for DB migrations
- `org.springframework.boot:spring-boot-starter-data-redis`

Messaging:
- `org.springframework.kafka:spring-kafka`
- `io.confluent:kafka-avro-serializer` (or `apicurio` alternatives)

Realtime:
- `org.springframework.boot:spring-boot-starter-websocket`
- `org.springframework:spring-messaging`

Gateway:
- `org.springframework.cloud:spring-cloud-starter-gateway`
- `org.springframework.cloud:spring-cloud-starter-circuitbreaker-reactor-resilience4j`

Observability:
- `io.micrometer:micrometer-registry-prometheus`
- OpenTelemetry Java agent at runtime (no dependency in pom): `-javaagent:/otel/opentelemetry-javaagent.jar`

Testing:
- `org.springframework.boot:spring-boot-starter-test`
- `org.testcontainers:junit-jupiter`
- `org.testcontainers:postgresql`
- `org.testcontainers:kafka`
- `org.testcontainers:redis`
- `org.testcontainers:minio`

Optional:
- `software.amazon.awssdk:s3` (for external S3)
- `org.springframework.boot:spring-boot-starter-webflux` (if using reactive stacks in specific services)

---

## Python Agent Integration (Kafka)

Existing Python components should be containerized and connected to Kafka:
- Consumer/producer library: `confluent-kafka` or `aiokafka`
- Use the same Avro schemas and Schema Registry
- Services:
  - OCR Worker: consumes `ocr.request.v1`, produces `ocr.result.v1`
  - PDF Worker: consumes `pdf.render.request.v1`, produces `pdf.render.result.v1`
  - LLM Worker(s): consumes `agents.task.request.v1`, produces `agents.task.result.v1`

This decouples the Java services from the Python runtime while ensuring reliable delivery and traceability.

---

## Docker and Local Dev

Create a `docker-compose.dev.yml` for local development with:
- `gateway` (Spring Cloud Gateway)
- `users-service`, `content-service`, `agent-orchestrator`, `moderation-service`, `notifications-service`, `file-service`
- `postgres` with database `etude`
- `redis`
- `minio` + `minio-setup` (bucket creation)
- `keycloak` (realm import at startup)
- `kafka` (KRaft, single node) + `schema-registry`
- `prometheus`, `grafana`, `loki`, `tempo` (or `jaeger`), `otel-collector`
- `python-workers` (optional containers for OCR/PDF/LLM during dev)

Example snippet (Kafka + Schema Registry + Postgres + Keycloak):
```yaml
services:
  kafka:
    image: bitnami/kafka:3.7
    environment:
      - KAFKA_CFG_PROCESS_ROLES=broker,controller
      - KAFKA_CFG_NODE_ID=1
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@kafka:9093
    ports: ["9092:9092"]

  schema-registry:
    image: confluentinc/cp-schema-registry:7.6.0
    environment:
      - SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS=kafka:9092
      - SCHEMA_REGISTRY_HOST_NAME=schema-registry
      - SCHEMA_REGISTRY_LISTENERS=http://0.0.0.0:8081
    ports: ["8081:8081"]

  postgres:
    image: postgres:16
    environment:
      - POSTGRES_DB=etude
      - POSTGRES_USER=etude
      - POSTGRES_PASSWORD=etude
    ports: ["5432:5432"]

  keycloak:
    image: quay.io/keycloak/keycloak:26.0
    command: ["start-dev", "--http-port=8080"]
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=admin
    ports: ["8080:8080"]
```

Each Java service should have a minimal Dockerfile, e.g.:
```dockerfile
# syntax=docker/dockerfile:1
FROM eclipse-temurin:21-jre as runtime
WORKDIR /app
COPY build/libs/*.jar app.jar
ENV JAVA_TOOL_OPTIONS="-XX:+ExitOnOutOfMemoryError -XX:MaxRAMPercentage=75"
ENTRYPOINT ["java","-jar","/app/app.jar"]
```

---

## Configuration

- Standardize env vars (12-factor):
  - `SPRING_PROFILES_ACTIVE=dev|prod`
  - `DB_URL`, `DB_USER`, `DB_PASSWORD`
  - `KAFKA_BOOTSTRAP_SERVERS`, `SCHEMA_REGISTRY_URL`
  - `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
  - `REDIS_URL`
  - `JWT_ISSUER_URI` (Keycloak), `JWT_AUDIENCE`

- Actuator endpoints secured, `/actuator/health` exposed
- CORS policies defined at Gateway

---

## Build and CI/CD

- Gradle Kotlin DSL or Maven with reproducible builds
- Lint/format: Spotless + Checkstyle; OWASP dependency check (CI)
- Unit tests + integration tests with Testcontainers
- Docker build per service, SBOM generation (e.g., Syft)
- Deploy to Kubernetes (optional) with Helm charts; configure liveness/readiness probes

---

## Testing Strategy

- Users Service: RBAC tests, parent-child link invariants
- Agent Orchestrator: outbox pattern, idempotency, Kafka integration tests
- Moderation: policy evaluation, admin approval flow
- E2E: compose up infra, run Postman/Newman or Karate tests against running stack

---

## Implementation Order (Suggested)

1) Bootstrap Gateway, Users Service, Postgres + Keycloak
2) Add RBAC and parent-student linking flows
3) Introduce Kafka + Schema Registry and Agent Orchestrator
4) Integrate Python workers via Kafka topics
5) Add Content + File Service (MinIO) and PDF/OCR flows
6) Add Moderation and Notifications services
7) Add observability and harden with rate limiting, retries, and audits

---

## Notes and Trade-offs

- Keycloak vs custom auth: Keycloak reduces custom security code and centralizes IAM
- JPA vs R2DBC: JPA is simpler and well-supported; R2DBC for fully reactive stacks
- Avro vs Protobuf: Avro integrates tightly with Schema Registry and Kafka tooling
- Microservices vs modular monolith: start with a few services; split further as needed

---

## Minimal Gradle Dependencies Example

Example `build.gradle.kts` snippet for a typical service:
```kotlin
plugins {
  id("org.springframework.boot") version "3.3.5"
  id("io.spring.dependency-management") version "1.1.6"
  kotlin("jvm") version "2.0.21" // if Kotlin; otherwise remove
}

dependencies {
  implementation("org.springframework.boot:spring-boot-starter-web")
  implementation("org.springframework.boot:spring-boot-starter-validation")
  implementation("org.springframework.boot:spring-boot-starter-security")
  implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
  implementation("org.springframework.kafka:spring-kafka")
  implementation("io.confluent:kafka-avro-serializer:7.6.0")
  implementation("org.springframework.boot:spring-boot-starter-data-jpa")
  implementation("org.postgresql:postgresql")
  implementation("org.flywaydb:flyway-core")
  implementation("org.springframework.boot:spring-boot-starter-actuator")
  implementation("io.micrometer:micrometer-registry-prometheus")
  implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.5.0")
  testImplementation("org.springframework.boot:spring-boot-starter-test")
  testImplementation("org.testcontainers:junit-jupiter")
  testImplementation("org.testcontainers:postgresql")
  testImplementation("org.testcontainers:kafka")
}
```

---

## Next Steps

- Confirm tech choices (Keycloak vs custom, Avro vs Protobuf)
- I can scaffold a multi-service Spring Boot workspace with Gradle, Dockerfiles, and a dev `docker-compose.dev.yml` wired for Postgres/Kafka/Keycloak. Let me know and I’ll generate the initial project structure.

