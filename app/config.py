import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[1]

load_dotenv(PROJECT_ROOT / ".env")

# Paths
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
VECTOR_DB_DIR = Path(os.getenv("VECTOR_DB_DIR", PROJECT_ROOT / "vector_db"))
FRONTEND_DIST_DIR = Path(os.getenv("FRONTEND_DIST_DIR", PROJECT_ROOT / "frontend" / "dist"))

# Vector store
COLLECTION_NAME = "darglobal_wasalt_knowledge"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# LLM provider
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/free")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_APP_TITLE = "DarGlobal AI Assistant"
LLM_TIMEOUT_SECONDS = 90

# Many free models "think" before answering, and those reasoning tokens count
# against max_tokens. Too low a limit leaves no room for the answer itself.
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "4000"))
LLM_REASONING_EFFORT = os.getenv("LLM_REASONING_EFFORT", "low")
LLM_MAX_ATTEMPTS = 2
