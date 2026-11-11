"""Evaluation benchmark API routes."""

from fastapi import APIRouter, HTTPException

from backend.pipeline.stores import store
from backend.evaluation.evaluate import run_evaluation_suite, load_eval_questions
from models.llm import check_ollama_health

router = APIRouter(tags=["Evaluation"])


@router.get("/evaluate/questions")
def get_evaluation_questions():
    """Retrieve the editable benchmark evaluation questions."""
    return load_eval_questions()


@router.post("/evaluate")
def run_evaluation():
    """Execute comparative benchmark between Baseline Vector RAG and GraphRAG."""
    # 1. Health check Ollama
    health = check_ollama_health()
    if not health.get("ok"):
        raise HTTPException(status_code=503, detail=health.get("error", "Ollama is not running."))

    # 2. Check if index exists
    if not store.has_index():
        raise HTTPException(
            status_code=400,
            detail="No knowledge graph index found. Please upload documents and index them first before running evaluations."
        )

    try:
        report = run_evaluation_suite(limit=5)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

