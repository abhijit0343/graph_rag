"""Backend configuration file defining directories, chunking parameters, retrieval defaults, and tracing flags."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Storage and persistence paths
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
STORAGE_DIR = DATA_DIR / "storage"

# Specific storage paths
GRAPH_PATH = STORAGE_DIR / "knowledge_graph.json"
COMMUNITIES_PATH = STORAGE_DIR / "communities.json"
CHUNKS_PATH = STORAGE_DIR / "chunks.json"
ENTITIES_PATH = STORAGE_DIR / "entities.json"
FAISS_DIR = STORAGE_DIR / "faiss_indices"

# Create directories on startup
for path in [DATA_DIR, UPLOAD_DIR, STORAGE_DIR, FAISS_DIR]:
    path.mkdir(parents=True, exist_ok=True)

# GraphRAG chunking parameters
CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "600"))
CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "100"))

# Retrieval parameters
DEFAULT_TOP_K: int = int(os.getenv("DEFAULT_TOP_K", "5"))
DEFAULT_HOPS: int = int(os.getenv("DEFAULT_HOPS", "2"))

# Tracing configuration: 'off', 'sample', 'full'
# 'sample' traces first 15 chunks + all community summaries to preserve rate limits
TRACE_INDEXING: str = os.getenv("TRACE_INDEXING", "sample").lower()

# LangSmith project
LANGSMITH_PROJECT: str = os.getenv("LANGSMITH_PROJECT", "local-graphrag")

# CORS allowed origins
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

