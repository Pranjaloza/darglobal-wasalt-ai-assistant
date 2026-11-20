# DarGlobal & Wasalt AI Assistant

An AI chatbot that answers questions about DarGlobal and Wasalt real estate. It has a FastAPI backend and a React frontend, uses a ChromaDB vector store for retrieval, and uses a free OpenRouter model for answers.

- **Property questions** (such as "villas in Madinah under 2 million with 5+ bedrooms") are parsed into filters and matched exactly against Wasalt listings.
- **All other questions** use semantic search over the combined knowledge base.

## Project structure

```
app/                    FastAPI application
  main.py               routes: /health, /chat, /properties, /api/info; serves the built frontend at /
  config.py             env vars, paths, model names
  schemas.py            request models
  prompts.py            LLM prompt templates
  services/
    chat_service.py     decides between property search and knowledge search
    query_parser.py     turns a question into property filters
    knowledge_search.py ChromaDB + embedding search
    llm_client.py       OpenRouter client
    errors.py           ServiceError -> HTTP response
frontend/               React + Vite + TypeScript chat UI
pipeline/               offline data pipeline (run in order, see below)
scripts/                one-off diagnostics, inspection and validation
tests/                  pytest suite
data/raw, data/processed  source and processed datasets
vector_db/              built ChromaDB store (git-ignored)
```

## Setup

```bash
python -m venv venv
venv\Scripts\activate            # Windows  (source venv/bin/activate on macOS/Linux)
pip install -r requirements-dev.txt
cp .env.example .env             # then set OPENROUTER_API_KEY
```

## Run locally (development)

```bash
# Terminal 1: backend
uvicorn app.main:app --reload --port 8001

# Terminal 2: frontend (reads VITE_API_BASE_URL from frontend/.env.development)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 for the chat UI, or http://localhost:8001/docs for the API docs.

## Build the data and vector DB

Run these from the project root:

```bash
python -m pipeline.scraper             # scrape Wasalt -> data/raw/wasalt.jsonl
python -m pipeline.extract_darglobal   # saved DarGlobal pages -> data/raw/darglobal.jsonl
python -m pipeline.improve_wasalt      # -> data/processed/wasalt_enriched.jsonl
python -m pipeline.prepare_dataset     # -> data/processed/combined_knowledge.jsonl
python -m pipeline.build_vector_db     # -> vector_db/
```

## Tests

```bash
pytest
```

`tests/test_knowledge_search.py` is skipped if `vector_db/` has not been built.

## Docker

A single image builds the frontend, the vector DB (from `data/processed/`) and the cached embedding model. It needs nothing from your machine except `.env`.

```bash
docker compose up --build
```

Open http://localhost:8001. The UI and the API are served from the same address.

Without compose:

```bash
docker build -t global-ai-assistant .
docker run -p 8001:8001 -e OPENROUTER_API_KEY=your-key global-ai-assistant
```

The port can be changed with `-e PORT=...`.
