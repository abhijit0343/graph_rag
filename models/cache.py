"""Disk cache for LLM calls.

Hashes prompt input (plus model parameters) to cache responses on disk,
avoiding redundant Ollama invocations during repeated development and testing.
"""

import hashlib
import json
import os
from typing import Optional
from models.config import CACHE_DIR


class DiskCache:
    """Simple SHA-256 disk cache for LLM prompt completions."""

    def __init__(self, cache_dir: str = CACHE_DIR):
        self.cache_dir = os.path.abspath(cache_dir)
        os.makedirs(self.cache_dir, exist_ok=True)

    def _hash_key(self, prompt: str, extra: str = "") -> str:
        """Create a deterministic SHA-256 hash from prompt text and optional parameters."""
        data = f"{prompt}___{extra}".encode("utf-8")
        return hashlib.sha256(data).hexdigest()

    def get(self, prompt: str, extra: str = "") -> Optional[str]:
        """Retrieve cached response if present, otherwise None."""
        key = self._hash_key(prompt, extra)
        path = os.path.join(self.cache_dir, f"{key}.json")
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    entry = json.load(f)
                    return entry.get("response")
            except Exception:
                return None
        return None

    def set(self, prompt: str, response: str, extra: str = "") -> None:
        """Store response text on disk keyed by hashed prompt."""
        key = self._hash_key(prompt, extra)
        path = os.path.join(self.cache_dir, f"{key}.json")
        try:
            entry = {
                "key": key,
                "extra": extra,
                "prompt": prompt,
                "response": response
            }
            with open(path, "w", encoding="utf-8") as f:
                json.dump(entry, f, ensure_ascii=False, indent=2)
        except Exception:
            pass


# Singleton instance
disk_cache = DiskCache()

