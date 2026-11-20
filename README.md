# DarGlobal & Wasalt AI Assistant

An AI chatbot that answers questions about DarGlobal's projects and Wasalt property listings, using data scraped from their public websites and a free model from OpenRouter.

**Live demo:** https://darglobal-wasalt-ai-assitant.onrender.com/
(Hosted on Render's free tier. After a period of inactivity the first load can take up to a minute while the server wakes up.)

**Try asking:**
- "Find villas in Madinah below 2 million SAR with at least 5 bedrooms"
- then the follow-up "What about Jeddah?"
- "What does DarGlobal do, and which countries does it build in?"

## How it works

```
Question ──► query parser ──► property question? ──yes──► exact filter search over Wasalt listings
                                      │                    (city, max price, bedrooms)
                                      no
                                      ▼
                               semantic search over DarGlobal + Wasalt text (ChromaDB)
                                      │
                                      ▼
            retrieved records + recent conversation ──► free OpenRouter model ──► answer with sources
```

- **Property questions** are turned into structured filters (city, budget, bedrooms) and matched exactly against the listing data, so prices and bedroom counts are never invented by the model. The model only summarises the matches; the UI shows every matching listing in a table that links to the original Wasalt page.
- **Other questions** (for example about DarGlobal) use semantic search over the combined text, and the answer lists its sources.
- **Follow-ups** build on the conversation: "what about Jeddah?" keeps the previous budget and bedroom filters and changes only the city. The model also sees the last few messages.
- **Grounding rules** in the prompts tell the model to use only the supplied records, say when information is missing, and avoid unsupported investment claims.

## Data collection

| Source | Records | How it was collected |
|---|---|---|
| Wasalt (wasalt.sa) | 76 pages scraped, 34 property listings with price, bedrooms, area and location | `pipeline/scraper.py` reads the site's sitemaps, checks `robots.txt` before fetching, and identifies itself with a descriptive User-Agent. `pipeline/improve_wasalt.py` extracts structured listing fields. |
| DarGlobal (darglobal.co.uk) | 15 company and project pages | The pages were saved from a browser and parsed by `pipeline/extract_darglobal.py` (records are tagged `collection_method: manual_browser_export`). |

`pipeline/prepare_dataset.py` combines both sources, and `pipeline/build_vector_db.py` chunks the text and stores embeddings in ChromaDB.

Listing data is a snapshot from collection time; prices and availability may have changed since.

## Features

- Chat-first interface with suggested questions, formatted answers, source links and a listings table for property results
- Follow-up questions that refine the previous search
- Loading and error states with retry; a live backend status indicator
- Conversation history saved in the browser (switch, delete, survives reloads)
- A **Listings** page to browse and filter all collected listings, for checking the scraped data
- Responsive layout for desktop and mobile

## Tech stack

| Part | Technology |
|---|---|
| Backend | Python 3.12, FastAPI |
| Retrieval | ChromaDB, all-MiniLM-L6-v2 embeddings (ONNX runtime, no PyTorch) |
| Language model | A free model via OpenRouter (`openrouter/free` by default, configurable) |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Packaging | One multi-stage Docker image: builds the frontend, the vector DB and the embedding model cache |
| Hosting | Render (free web service, deployed from this repository's Dockerfile) |

## Project structure

```
app/                     FastAPI application
  main.py                routes: /chat, /properties, /api/stats, /health; serves the built frontend at /
  config.py              environment variables, paths, model settings
  schemas.py             request models
  prompts.py             LLM prompt templates and grounding rules
  services/
    chat_service.py      routing, follow-up handling, answer assembly
    query_parser.py      turns a question into property filters
    knowledge_search.py  ChromaDB semantic and filter search
    embeddings.py        ONNX embedding model
    llm_client.py        OpenRouter client (with retry on empty answers)
frontend/                React chat UI
pipeline/                data collection and processing (run in order, see below)
scripts/                 one-off diagnostics and validation
tests/                   pytest suite
data/raw, data/processed collected and processed datasets
```

## Run it

### With Docker

```bash
cp .env.example .env            # then set OPENROUTER_API_KEY
docker compose up --build
```

Open http://localhost:8001. The UI and the API are served from the same address.

Without compose:

```bash
docker build -t global-ai-assistant .
docker run -p 8001:8001 -e OPENROUTER_API_KEY=your-key global-ai-assistant
```

### Locally, for development

```bash
python -m venv venv
venv\Scripts\activate            # Windows  (source venv/bin/activate on macOS/Linux)
pip install -r requirements-dev.txt
cp .env.example .env             # then set OPENROUTER_API_KEY

python -m pipeline.build_vector_db              # build the vector DB from data/processed
uvicorn app.main:app --reload --port 8001       # backend

cd frontend && npm install && npm run dev        # frontend at http://localhost:5173
```

### Rebuild the data from scratch

```bash
python -m pipeline.scraper             # scrape -> data/raw/*.jsonl
python -m pipeline.extract_darglobal   # saved DarGlobal pages -> data/raw/darglobal.jsonl
python -m pipeline.improve_wasalt      # -> data/processed/wasalt_enriched.jsonl
python -m pipeline.prepare_dataset     # -> data/processed/combined_knowledge.jsonl
python -m pipeline.build_vector_db     # -> vector_db/
```

## Tests

```bash
pytest
```

Covers the query parser, follow-up filter handling, the API routes (with the model stubbed out) and, when `vector_db/` exists, the real retrieval.

## Limitations

- The dataset is small (34 listings in Madinah and Jeddah, 15 DarGlobal pages) and is a snapshot, not live data.
- `openrouter/free` routes each request to whichever free model is available, so answer style and speed vary (typically 5–50 seconds). Setting `OPENROUTER_MODEL` to one specific free model makes answers more consistent.
- Conversation history is stored in the visitor's browser only; there are no user accounts.
