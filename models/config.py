"""Configuration settings for LLM, embeddings, and Ollama integration."""

import os
from dotenv import load_dotenv

# Load local environment variables if available
load_dotenv()

OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL: str = os.getenv("LLM_MODEL", "llama3.2:3b")
EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")

LLM_TEMPERATURE: float = 0.0
LLM_NUM_CTX: int = 4096

# Disk cache directory for LLM calls
CACHE_DIR: str = os.getenv("CACHE_DIR", os.path.join(os.path.dirname(__file__), "..", ".cache", "llm"))

