"""Text embeddings for the vector store.

Uses ChromaDB's built-in ONNX build of all-MiniLM-L6-v2. It produces the same
normalised vectors as sentence-transformers' all-MiniLM-L6-v2 but runs on
onnxruntime instead of PyTorch, so the app fits in ~512 MB of RAM.
"""

from functools import lru_cache
from pathlib import Path
from threading import Lock

import numpy as np
from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2

from app import config


_embedder_lock = Lock()


def get_embedder() -> ONNXMiniLM_L6_V2:
    with _embedder_lock:
        return _build_embedder()


@lru_cache
def _build_embedder() -> ONNXMiniLM_L6_V2:
    # Keep the model inside a known folder so it can be baked into the Docker image.
    ONNXMiniLM_L6_V2.DOWNLOAD_PATH = Path(config.EMBEDDING_CACHE_DIR) / ONNXMiniLM_L6_V2.MODEL_NAME
    return ONNXMiniLM_L6_V2(preferred_providers=["CPUExecutionProvider"])


def embed(texts):
    """Return a list of normalised embedding vectors (lists of floats)."""
    vectors = get_embedder()(list(texts))
    return np.asarray(vectors, dtype=np.float32).tolist()
