"""LangSmith tracing configuration, context managers, and run URL utilities.

Ensures zero crashes when LANGSMITH_API_KEY is absent, seamlessly toggling
tracing off while preserving complete function execution.
"""

import os
import logging
from typing import Any, Callable, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("graphrag.tracing")

# Check if LangSmith credentials exist
LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")
LANGSMITH_TRACING = os.getenv("LANGSMITH_TRACING", "false").lower() in ("true", "1", "yes")
LANGSMITH_PROJECT = os.getenv("LANGSMITH_PROJECT", "local-graphrag")

tracing_enabled = False
ls_client = None

if LANGSMITH_TRACING and LANGSMITH_API_KEY and LANGSMITH_API_KEY.strip() and not LANGSMITH_API_KEY.startswith("your_"):
    try:
        from langsmith import Client, traceable, tracing_context
        ls_client = Client(api_key=LANGSMITH_API_KEY)
        tracing_enabled = True
        logger.info("LangSmith tracing initialized for project: %s", LANGSMITH_PROJECT)
    except Exception as e:
        logger.warning("Could not initialize LangSmith Client: %s. Tracing disabled.", e)
        tracing_enabled = False
else:
    logger.warning("LANGSMITH_API_KEY not configured or tracing disabled. Running without remote tracing.")

# Safe fallback decorators if LangSmith is disabled or fails
if not tracing_enabled:
    def traceable(
        run_type: str = "chain",
        name: Optional[str] = None,
        metadata: Optional[dict] = None,
        tags: Optional[list] = None,
        **kwargs: Any,
    ) -> Callable:
        """No-op traceable decorator when LangSmith is not active."""
        def decorator(func: Callable) -> Callable:
            return func
        return decorator

    class DummyTracingContext:
        def __init__(self, enabled: bool = True, **kwargs: Any) -> None:
            self.enabled = enabled

        def __enter__(self) -> "DummyTracingContext":
            return self

        def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
            pass

    tracing_context = DummyTracingContext  # type: ignore
else:
    from langsmith import traceable, tracing_context  # type: ignore


def get_langsmith_client():
    """Return the active LangSmith client instance if available."""
    global ls_client
    if tracing_enabled and ls_client is None:
        try:
            from langsmith import Client
            ls_client = Client()
        except Exception:
            pass
    return ls_client


def build_trace_url(run_id: str) -> Optional[str]:
    """Generate a direct web link to view a run trace in LangSmith app."""
    if not tracing_enabled or not run_id:
        return None
    # LangSmith run url format: https://smith.langchain.com/o/<org>/projects/p/<project>/r/<run_id>
    return f"https://smith.langchain.com/public/{run_id}/r"


def record_user_feedback(run_id: str, score: float, comment: Optional[str] = None) -> bool:
    """Submit user feedback (0 or 1 score) to LangSmith for a specific run."""
    client = get_langsmith_client()
    if not client or not run_id:
        return False
    try:
        client.create_feedback(
            run_id=run_id,
            key="user_score",
            score=score,
            comment=comment or ("User approved" if score == 1 else "User flagged")
        )
        return True
    except Exception as e:
        logger.error("Failed to record feedback in LangSmith: %s", e)
        return False

