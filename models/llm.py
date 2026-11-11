"""Ollama LLM and Embeddings setup, health checking, and cached generation helpers."""

import httpx
from typing import Any, Dict, List, Optional
from langchain_ollama import ChatOllama, OllamaEmbeddings
from models.config import (
    OLLAMA_BASE_URL,
    LLM_MODEL,
    EMBEDDING_MODEL,
    LLM_TEMPERATURE,
    LLM_NUM_CTX,
)
from models.cache import disk_cache


def get_llm(json_mode: bool = False, temperature: float = LLM_TEMPERATURE) -> ChatOllama:
    """Return an instance of ChatOllama configured with exact context size and temperature."""
    kwargs: Dict[str, Any] = {
        "model": LLM_MODEL,
        "base_url": OLLAMA_BASE_URL,
        "temperature": temperature,
        "num_ctx": LLM_NUM_CTX,
    }
    if json_mode:
        kwargs["format"] = "json"

    return ChatOllama(**kwargs)


def get_embeddings() -> OllamaEmbeddings:
    """Return an instance of OllamaEmbeddings using nomic-embed-text."""
    return OllamaEmbeddings(
        model=EMBEDDING_MODEL,
        base_url=OLLAMA_BASE_URL,
    )


def check_ollama_health() -> Dict[str, Any]:
    """Check if Ollama server is running and required models are available.

    Returns a dict with 'ok': bool, and helpful 'error': str if not.
    """
    try:
        with httpx.Client(timeout=3.0) as client:
            resp = client.get(f"{OLLAMA_BASE_URL.rstrip('/')}/api/tags")
            if resp.status_code != 200:
                return {
                    "ok": False,
                    "error": (
                        f"Ollama server responded with status {resp.status_code}. "
                        "Please verify that Ollama is running properly."
                    ),
                }

            data = resp.json()
            models_list = [m.get("name", "") for m in data.get("models", [])]

            # Normalize model names to handle tags (e.g. llama3.2:3b, llama3.2:3b-instruct-q4_K_M, nomic-embed-text:latest)
            has_llm = any(LLM_MODEL in m or m.startswith(LLM_MODEL.split(":")[0]) for m in models_list)
            has_embed = any(EMBEDDING_MODEL in m or m.startswith(EMBEDDING_MODEL.split(":")[0]) for m in models_list)

            missing: List[str] = []
            if not has_llm:
                missing.append(f"ollama pull {LLM_MODEL}")
            if not has_embed:
                missing.append(f"ollama pull {EMBEDDING_MODEL}")

            if missing:
                return {
                    "ok": False,
                    "error": (
                        f"Required models not found in Ollama. "
                        f"Please run in your terminal: {' && '.join(missing)}"
                    ),
                    "installed_models": models_list,
                }

            return {
                "ok": True,
                "error": None,
                "installed_models": models_list,
            }

    except httpx.ConnectError:
        return {
            "ok": False,
            "error": (
                f"Cannot connect to Ollama at {OLLAMA_BASE_URL}. "
                "Make sure Ollama is installed and running (`ollama serve` in a terminal)."
            ),
        }
    except Exception as e:
        return {
            "ok": False,
            "error": f"Error communicating with Ollama: {str(e)}",
        }


def call_llm_cached(
    prompt: str,
    system_prompt: Optional[str] = None,
    json_mode: bool = False,
    use_cache: bool = True,
) -> str:
    """Invoke Ollama LLM with disk cache support."""
    cache_key = f"{LLM_MODEL}_{json_mode}_{system_prompt or ''}"
    if use_cache:
        cached = disk_cache.get(prompt, extra=cache_key)
        if cached is not None:
            return cached

    llm = get_llm(json_mode=json_mode)
    messages = []
    if system_prompt:
        messages.append(("system", system_prompt))
    messages.append(("human", prompt))

    response = llm.invoke(messages)
    text = response.content if hasattr(response, "content") else str(response)

    if use_cache and text:
        disk_cache.set(prompt, text, extra=cache_key)

    return text

