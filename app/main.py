from functools import lru_cache
from threading import Lock
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import config
from app.schemas import ChatRequest
from app.services.chat_service import answer_question
from app.services.errors import ServiceError
from app.services.knowledge_search import KnowledgeSearch

app = FastAPI(
    title="DarGlobal & Wasalt AI Assistant",
    description="AI-powered real estate knowledge assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


_knowledge_lock = Lock()


@lru_cache
def _build_knowledge() -> KnowledgeSearch:
    return KnowledgeSearch()


def get_knowledge() -> KnowledgeSearch:
    """Load the vector DB and embedding model once, on first use.

    FastAPI runs sync endpoints in a thread pool, so the first requests can
    arrive together; the lock makes sure only one of them builds it.
    """
    with _knowledge_lock:
        return _build_knowledge()


@app.exception_handler(ServiceError)
def handle_service_error(request: Request, error: ServiceError):
    return JSONResponse(status_code=error.status_code, content={"detail": error.detail})


@app.get("/api/info")
def info():
    return {
        "message": "DarGlobal & Wasalt AI Assistant API",
        "status": "running"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/api/stats")
def stats(knowledge: KnowledgeSearch = Depends(get_knowledge)):
    try:
        return knowledge.stats()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Stats failed: {error}")


@app.post("/chat")
def chat(request: ChatRequest, knowledge: KnowledgeSearch = Depends(get_knowledge)):
    return answer_question(request.question.strip(), knowledge)


@app.get("/properties")
def search_properties(
    city: Optional[str] = None,
    max_price: Optional[float] = Query(default=None, gt=0),
    min_bedrooms: Optional[int] = Query(default=None, ge=1),
    exact_bedrooms: Optional[int] = Query(default=None, ge=1),
    currency: str = "SAR",
    limit: int = Query(default=10, ge=1, le=50),
    knowledge: KnowledgeSearch = Depends(get_knowledge)
):
    try:
        properties = knowledge.property_search(
            city=city,
            max_price=max_price,
            min_bedrooms=min_bedrooms,
            exact_bedrooms=exact_bedrooms,
            currency=currency,
            limit=limit
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Property search failed: {error}"
        )

    return {
        "filters": {
            "city": city,
            "max_price": max_price,
            "min_bedrooms": min_bedrooms,
            "exact_bedrooms": exact_bedrooms,
            "currency": currency
        },
        "total_returned": len(properties),
        "properties": properties
    }


# Serve the built React app from the same origin as the API (production / Docker).
# In local development the Vite dev server serves the frontend instead.
# Mounted last so the API routes above take priority.
if (config.FRONTEND_DIST_DIR / "index.html").exists():
    app.mount("/", StaticFiles(directory=config.FRONTEND_DIST_DIR, html=True), name="frontend")
else:
    @app.get("/")
    def home():
        return info()
