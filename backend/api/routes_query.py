"""Query execution and user feedback routes."""

import time
import uuid
import logging
from typing import Optional, Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.config import DEFAULT_TOP_K, DEFAULT_HOPS
from backend.pipeline.stores import store
from backend.retrieval.router import route_query
from backend.retrieval.local_search import run_local_search
from backend.retrieval.global_search import run_global_search
from backend.tracing import traceable, record_user_feedback, build_trace_url
from models.llm import check_ollama_health

router = APIRouter(tags=["Query"])
logger = logging.getLogger("graphrag.api.query")


class QueryRequest(BaseModel):
    question: str = Field(..., description="The query to answer via GraphRAG")
    mode: Literal["auto", "local", "global"] = Field(default="auto", description="Retrieval routing mode")
    k: Optional[int] = Field(default=DEFAULT_TOP_K, description="Top-k entities to retrieve")
    hops: Optional[int] = Field(default=DEFAULT_HOPS, description="Graph neighborhood expansion hops")


class FeedbackRequest(BaseModel):
    run_id: str = Field(..., description="LangSmith or query run identifier")
    score: int = Field(..., ge=0, le=1, description="Binary score: 1 (positive) or 0 (negative)")


@traceable(name="query_graphrag", run_type="chain")
def _execute_query(question: str, mode: str, k: int, hops: int):
    """Internal traceable coordinator for query execution."""
    mode_used = mode
    if mode == "auto":
        mode_used = route_query(question)

    if mode_used == "global":
        result = run_global_search(question)
    else:
        result = run_local_search(question, k=k, hops=hops)

    return result, mode_used


@router.post("/query")
def execute_query(req: QueryRequest):
    """Query the GraphRAG pipeline in auto, local, or global mode."""
    # 1. Health check Ollama
    health = check_ollama_health()
    if not health.get("ok"):
        raise HTTPException(status_code=503, detail=health.get("error", "Ollama is not running."))

    # 2. Check if index exists
    if not store.has_index():
        raise HTTPException(
            status_code=400,
            detail="No knowledge graph index found. Please upload documents and run indexing first on the Upload page."
        )

    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    run_id = str(uuid.uuid4())
    start_time = time.perf_counter()

    try:
        result, mode_used = _execute_query(
            question=question,
            mode=req.mode,
            k=req.k or DEFAULT_TOP_K,
            hops=req.hops or DEFAULT_HOPS,
        )
    except Exception as e:
        logger.exception("Query execution failed: %s", e)
        raise HTTPException(status_code=500, detail=f"GraphRAG execution error: {str(e)}")

    latency_ms = int((time.perf_counter() - start_time) * 1000)
    trace_url = build_trace_url(run_id)

    return {
        "answer": result.get("answer", ""),
        "mode_used": mode_used,
        "sources": result.get("sources", {"entities": [], "paths": [], "chunks": []}),
        "subgraph": result.get("subgraph", {"nodes": [], "links": []}),
        "run_id": run_id,
        "trace_url": trace_url,
        "latency_ms": latency_ms,
    }


@router.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    """Record user thumbs up/down feedback for a query run."""
    ok = record_user_feedback(req.run_id, float(req.score))
    return {"ok": True, "logged_to_langsmith": ok}

