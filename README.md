# Etude.AI

Etude.AI is a full-stack intelligent learning platform designed to help students learn through personalized explanations, guided practice, adaptive quizzes, and progress-aware study planning.

The project combines a modern web application with a multi-service AI backend. A student can choose a class, subject, and module, generate a simplified lesson, ask follow-up questions, take a quiz, and save the session. Parents and students can review progress from the dashboard, inspect previous sessions, and generate personalized learning plans based on past activity.

This repository is useful for anyone who wants to understand how a real AI education product can be assembled from a frontend, backend, identity provider, knowledge graph, vector search engine, LLM pipeline, and deployment stack.

## What Makes This Project Interesting

Etude.AI is not just a chatbot wrapper. It is a complete learning platform with multiple coordinated systems:

- A student-facing Angular application with lesson, quiz, chatbot, profile, and dashboard flows
- A Spring Boot backend that manages users, sessions, achievements, security, and persistence
- A FastAPI AI Pipeline that handles LLM-powered learning features
- A curriculum knowledge graph in Neo4j
- A semantic retrieval layer in Qdrant
- Redis-backed memory and caching
- Keycloak authentication
- PostgreSQL persistence
- Nginx gateway routing
- Docker Compose and Kubernetes deployment files
- Prometheus and Grafana observability support

At a high level, the platform turns structured curriculum data and student activity into interactive learning experiences.

## Product Experience

A typical user journey looks like this:

```text
Student signs up or logs in
  -> selects class level
  -> selects subject
  -> chooses learning mode
  -> selects a module
  -> receives an AI-generated lesson, quiz, or Q&A experience
  -> completes the session
  -> session is saved
  -> progress and achievements are updated
  -> dashboard uses history to suggest future learning sessions
```

Main learning modes:

| Mode | Description |
|---|---|
| Lesson Summary | Generates a simplified lesson with slide-style content from curriculum data |
| Q&A Chatbot | Answers student questions using memory and retrieval context |
| Quiz | Generates and runs a gamified quiz experience |
| Learning Plan | Builds a personalized study plan from goals and learning history |
| Text to Speech | Converts lesson text to audio |
| Session Report | Produces feedback and report-style output for review |

## System Architecture

```text
Browser
  |
  v
Nginx Gateway
  |-- serves Angular frontend
  |-- proxies /api/* to Spring Boot backend
  |-- proxies /auth/* to Keycloak

Spring Boot Backend
  |-- validates Keycloak JWT tokens
  |-- manages users, sessions, achievements, and gamification
  |-- stores application data in PostgreSQL
  |-- uses Redis for caching
  |-- forwards AI requests to the FastAPI AI Pipeline

FastAPI AI Pipeline
  |-- runs CrewAI agents and LLM workflows
  |-- retrieves curriculum structure from Neo4j
  |-- retrieves semantic context from Qdrant
  |-- stores session memory in Redis
  |-- generates summaries, answers, quizzes, plans, TTS, and reports
```

The architecture separates concerns cleanly:

| Layer | Role |
|---|---|
| Frontend | Learning interface and user experience |
| Backend | Secure business API and persistence |
| AI Pipeline | LLM orchestration, retrieval, memory, TTS, and reports |
| Keycloak | Authentication and identity management |
| PostgreSQL | Durable user/session/achievement data |
| Redis | Cache, session memory, embedding cache |
| Neo4j | Curriculum graph and lesson relationships |
| Qdrant | Vector search over educational content |
| Nginx | Public entry point and reverse proxy |

## Technology Stack

### Frontend

- Angular 19
- TypeScript
- RxJS
- Keycloak Angular
- FontAwesome
- Material Design Icons

### Backend

- Java 21
- Spring Boot 3.5.7
- Spring Security
- OAuth2 Resource Server
- Spring Data JPA
- PostgreSQL
- Flyway
- Redis
- WebClient
- Springdoc OpenAPI
- Actuator and Prometheus metrics
- Sentry integration
- Bucket4j rate limiting

### AI Pipeline

- Python 3.11
- FastAPI
- Uvicorn
- CrewAI
- CrewAI Tools
- LangChain packages
- Neo4j driver
- Qdrant client
- Redis
- LiteLLM
- Google Generative AI SDK
- ElevenLabs
- ReportLab
- Arabic text rendering utilities
- Prometheus client
- Sentry SDK

### Infrastructure

- Docker
- Docker Compose
- Nginx
- Kubernetes manifests
- Prometheus
- Grafana
- Keycloak

## Repository Structure

```text
.
|-- frontend/                  Angular application
|   |-- src/app/               Components, services, guards, models, routes
|   |-- src/assets/            Images, fonts, fallback lesson/quiz data
|   |-- src/environments/      Frontend environment configuration
|   |-- angular.json
|   `-- package.json
|
|-- backend/                   Spring Boot backend
|   |-- src/main/java/         Controllers, services, entities, repositories, config
|   |-- src/main/resources/    Application config, migrations, logging
|   |-- ops/                   Keycloak, Prometheus, Grafana, Postgres support files
|   |-- Dockerfile
|   |-- docker-compose.yml
|   |-- pom.xml
|   |-- mvnw
|   `-- mvnw.cmd
|
|-- AI Pipeline/               Python AI service
|   |-- app/app.py             FastAPI app and AI endpoints
|   |-- app/handlers.py        Summary, Q&A, and quiz orchestration
|   |-- app/runtime.py         LLM, agents, Qdrant tool, shared runtime objects
|   |-- app/crew/              CrewAI agents, tasks, tools, planner crew
|   |-- app/tts/               ElevenLabs integration
|   |-- databases_construction/ Neo4j and Qdrant construction scripts
|   |-- config_files/          Book, fonts, captions, extracted images
|   |-- Dockerfile
|   |-- requirements.txt
|   `-- tests/
|
|-- gateway/                   Nginx gateway and frontend container build
|   |-- nginx.conf
|   `-- Dockerfile
|
|-- k8s/                       Kubernetes manifests
|   |-- 00-namespace.yaml
|   |-- 01-secrets.yaml.template
|   |-- 02-infrastructure.yaml
|   |-- 03-ai-pipeline.yaml
|   |-- 04-backend.yaml
|   |-- 05-frontend.yaml
|   |-- 06-ingress.yaml
|   `-- 07-monitoring.yaml
|
|-- .env.example               Environment variable template
|-- deploy-to-k8s.ps1          Kubernetes deployment helper
|-- REPO_ANALYSIS.md           Detailed repository analysis
|-- AI_PIPELINE_DEEP_DIVE_REPORT.md
`-- README.md
```

## Core Services

### Frontend

The Angular frontend provides the learning experience:

- Landing, signup, and signin screens
- Class, subject, mode, and module selection
- Lesson board for generated summaries
- Q&A chatbot
- Gamified quiz interface
- Dashboard with sessions, achievements, and planning tools
- Profile and account management
- Session history viewer

The frontend calls the backend through relative URLs:

```text
/api
/api/ai
/auth
```

This makes the application work cleanly behind the Nginx gateway.

### Backend

The Spring Boot backend is the secure application API.

It handles:

- Keycloak JWT validation
- User profile management
- Session saving and history
- Quiz score submission
- Achievement progress
- Gamification and ELO updates
- PostgreSQL persistence
- Redis caching
- Proxying AI requests to the Python service

Important backend route groups:

```text
/api/public/*        public registration
/api/users/*         user profile APIs
/api/sessions/*      learning session APIs
/api/achievements/*  achievement APIs
/api/ai/*            AI proxy endpoints
```

### AI Pipeline

The AI Pipeline is the Python service responsible for intelligent learning features.

It exposes:

```text
GET  /health
GET  /liveness
GET  /readiness
GET  /metrics
GET  /circuit-breakers
POST /summary
POST /qa
POST /quiz
POST /plan
POST /tts
POST /finish
```

Internally it uses:

- CrewAI agents for summary, Q&A, quiz, feedback, and planning
- Neo4j to find curriculum branches, topics, lessons, and images
- Qdrant for vector search over educational content
- Redis for conversation memory and embedding cache
- ElevenLabs for speech generation
- ReportLab for PDF report generation

### Gateway

The Nginx gateway is the main public entry point.

It serves the Angular app and proxies:

```text
/api/*   -> backend
/auth/*  -> Keycloak
```

It also includes longer proxy timeouts for AI endpoints, because LLM calls can take longer than regular API requests.

## Quick Start

The fastest way to run the project locally is Docker Compose.

### Prerequisites

- Docker Desktop or Docker Engine
- Docker Compose plugin
- Git
- At least 8 GB of memory available to Docker
- Valid provider keys for AI features, depending on the configured models

### 1. Create the environment file

From the repository root:

```powershell
Copy-Item .env.example .env
```

On Linux or macOS:

```bash
cp .env.example .env
```

Edit `.env` and set your local values.

Recommended local Docker values:

```env
NEO4J_URI=bolt://neo4j:7687
QDRANT_URL=http://qdrant:6333
REDIS_URL=redis://redis:6379/0
AI_PIPELINE_URL=http://ai-pipeline:8000
KEYCLOAK_AUTH_SERVER_URL=http://keycloak:8080/auth
KEYCLOAK_PUBLIC_URL=http://localhost:8080/auth
```

You also need to set provider keys such as:

```env
LLM_API_KEY=...
GEMINI_API_KEY=...
MISTRAL_API_KEY=...
ELEVENLABS_API_KEY=...
```

The exact keys required depend on the selected `LLM_MODEL` and `EMBEDDING_MODEL`.

### 2. Start the full stack

```powershell
cd backend
docker compose --env-file ../.env up --build
```

Detached mode:

```powershell
cd backend
docker compose --env-file ../.env up --build -d
```

### 3. Open the app

```text
http://localhost:8080
```

### 4. Check health endpoints

```bash
curl http://localhost:8081/actuator/health
curl http://localhost:8000/health
curl http://localhost:8000/readiness
```

## Local Service URLs

| Service | URL |
|---|---|
| Web application | `http://localhost:8080` |
| Backend API | `http://localhost:8081` |
| Backend health | `http://localhost:8081/actuator/health` |
| Backend Swagger UI | `http://localhost:8081/swagger-ui/index.html` |
| AI Pipeline | `http://localhost:8000` |
| AI Pipeline docs | `http://localhost:8000/docs` |
| AI Pipeline health | `http://localhost:8000/health` |
| Keycloak through gateway | `http://localhost:8080/auth` |
| Keycloak direct port | `http://localhost:8083/auth` |
| Neo4j browser | `http://localhost:7474` |
| Qdrant HTTP API | `http://localhost:6333` |
| Prometheus | `http://localhost:9090` |
| Grafana | `http://localhost:3000` |

## Environment Variables

The project uses `.env` for Docker Compose and service configuration.

Important variables:

| Variable | Purpose |
|---|---|
| `ALLOWED_ORIGINS` | Allowed CORS origins |
| `KEYCLOAK_AUTH_SERVER_URL` | Internal Keycloak URL used by backend |
| `KEYCLOAK_PUBLIC_URL` | Public Keycloak issuer URL |
| `KEYCLOAK_REALM` | Keycloak realm, usually `etudeai` |
| `KEYCLOAK_RESOURCE` | Backend Keycloak client/resource |
| `KEYCLOAK_CLIENT_SECRET` | Backend client secret if required |
| `POSTGRES_DB` | PostgreSQL database name |
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `REDIS_URL` | Redis URL used by Python clients |
| `NEO4J_URI` | Neo4j Bolt URI |
| `NEO4J_USER` | Neo4j username |
| `NEO4J_PASSWORD` | Neo4j password |
| `QDRANT_URL` | Qdrant HTTP URL |
| `QDRANT_API_KEY` | Qdrant API key, optional for local Docker |
| `LLM_API_KEY` | API key for the configured chat model provider |
| `LLM_MODEL` | Chat model used by CrewAI/LiteLLM |
| `EMBEDDING_MODEL` | Embedding model used for vector indexing/search |
| `GEMINI_API_KEY` | Google API key if Gemini embeddings are used |
| `MISTRAL_API_KEY` | Mistral API key if Mistral models are used |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for TTS |
| `SENTRY_DSN` | Optional AI Pipeline Sentry DSN |
| `SENTRY_DSN_BACKEND` | Optional backend Sentry DSN |
| `AI_PIPELINE_URL` | Backend-to-AI Pipeline URL |

## Development Setup

Docker Compose is recommended for databases and infrastructure. Individual application services can still be run locally.

### Frontend

```powershell
cd frontend
npm install
npm start
```

The Angular dev server runs at:

```text
http://localhost:4200
```

If running without the Nginx gateway, configure proxying for `/api` and `/auth` as needed.

### Backend

PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Linux or macOS:

```bash
cd backend
./mvnw spring-boot:run
```

The backend requires PostgreSQL, Redis, and Keycloak. Running those through Docker Compose is usually the easiest local setup.

### AI Pipeline

PowerShell:

```powershell
cd "AI Pipeline"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m main
```

Linux or macOS:

```bash
cd "AI Pipeline"
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m main
```

The AI Pipeline requires Redis, Neo4j, Qdrant, and model provider keys.

## API Overview

### Backend API

Base path:

```text
/api
```

| Route | Description |
|---|---|
| `POST /api/public/register` | Register a user in Keycloak and the local database |
| `GET /api/users/me` | Get current user profile |
| `PUT /api/users/me` | Update current user profile |
| `DELETE /api/users/me` | Delete current user profile |
| `POST /api/users/me/change-password` | Change current user's password |
| `GET /api/sessions` | Get current user's learning sessions |
| `GET /api/sessions/{id}` | Get one session with details |
| `POST /api/sessions/save` | Save a learning session |
| `PUT /api/sessions/{id}` | Update a learning session |
| `POST /api/sessions/quiz/submit` | Submit quiz result |
| `GET /api/achievements/me` | Get current user's achievement progress |

### AI Proxy Endpoints

The frontend usually calls AI features through the backend:

| Backend Route | AI Pipeline Route |
|---|---|
| `POST /api/ai/summary` | `POST /summary` |
| `POST /api/ai/qa` | `POST /qa` |
| `POST /api/ai/quiz` | `POST /quiz` |
| `POST /api/ai/plan` | `POST /plan` |
| `POST /api/ai/tts` | `POST /tts` |
| `GET /api/ai/health` | `GET /health` |

### AI Pipeline Endpoints

| Route | Description |
|---|---|
| `GET /health` | Dependency health summary |
| `GET /liveness` | Liveness probe |
| `GET /readiness` | Readiness probe |
| `GET /metrics` | Prometheus metrics |
| `GET /circuit-breakers` | Circuit breaker state |
| `POST /summary` | Generate lesson summary |
| `POST /qa` | Answer a student question |
| `POST /quiz` | Generate quiz questions |
| `POST /plan` | Generate learning plan |
| `POST /tts` | Generate MP3 audio from text |
| `POST /finish` | Generate feedback and session report |
| `GET /lessons/{file}` | Serve generated lesson JSON |
| `GET /reports/{file}` | Serve generated PDF report |

Example summary request:

```bash
curl -X POST http://localhost:8000/summary \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: demo-session" \
  -d "{\"module\":\"<topic-name>\"}"
```

## AI Data Initialization

The AI Pipeline depends on two knowledge stores:

- Neo4j for curriculum graph data
- Qdrant for vector search data

The Docker entrypoint runs:

```text
AI Pipeline/check_and_populate_databases.py
```

This script checks whether Neo4j and Qdrant already contain data and attempts to populate them if they are empty.

Neo4j construction script:

```text
AI Pipeline/databases_construction/kg_construction.py
```

Qdrant construction script:

```text
AI Pipeline/databases_construction/Qdrant_database_construction.py
```

Qdrant population expects JSON chunks from one of these locations:

```text
AI Pipeline/config_files/Book_with_axes.json
AI Pipeline/config_files/ktebjson/Book.pdf.json
```

or from:

```env
JSON_PATH=/path/to/chunks.json
```

OCR utilities are available in:

```text
AI Pipeline/databases_construction/ocr_pdf.py
```

## Testing

### Backend

PowerShell:

```powershell
cd backend
.\mvnw.cmd test
```

Linux or macOS:

```bash
cd backend
./mvnw test
```

### Frontend

```powershell
cd frontend
npm test
```

### AI Pipeline

```powershell
cd "AI Pipeline"
pytest
```

Some AI Pipeline tests are integration-style and may require Redis, Neo4j, Qdrant, or the FastAPI service to be running.

## Deployment

### Docker Compose

Start:

```powershell
cd backend
docker compose --env-file ../.env up --build -d
```

Stop:

```powershell
cd backend
docker compose --env-file ../.env down
```

Stop and remove volumes:

```powershell
cd backend
docker compose --env-file ../.env down -v
```

The `-v` option removes local database and service volumes.

### Kubernetes

Kubernetes manifests are in:

```text
k8s/
```

Deployment helper:

```powershell
.\deploy-to-k8s.ps1
```

Before deploying:

1. Copy `k8s/01-secrets.yaml.template` to `k8s/01-secrets.yaml`.
2. Replace all placeholder secrets.
3. Review hostnames, TLS configuration, image tags, storage classes, and resource limits.
4. Confirm Keycloak, PostgreSQL, Neo4j, Qdrant, Redis, backend, AI Pipeline, and gateway settings.

## Observability

The project includes monitoring support:

- Backend metrics through Spring Actuator and Prometheus
- AI Pipeline metrics through Prometheus client
- Prometheus service in Docker Compose and Kubernetes
- Grafana provisioning files
- Sentry integration points for backend and AI Pipeline
- Structured logging in backend and Python service

Useful endpoints:

```text
http://localhost:8081/actuator/health
http://localhost:8081/actuator/prometheus
http://localhost:8000/health
http://localhost:8000/readiness
http://localhost:8000/metrics
```

## License

A license file is not currently included. Add a `LICENSE` file before public distribution.
