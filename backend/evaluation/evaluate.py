"""Evaluation runner comparing Baseline Vector RAG vs GraphRAG with LangSmith experiments."""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List

from backend.retrieval.baseline import run_baseline_search
from backend.retrieval.local_search import run_local_search
from backend.retrieval.global_search import run_global_search
from backend.retrieval.router import route_query
from backend.evaluation.evaluators import judge_groundedness, judge_correctness, compute_context_hit
from backend.tracing import get_langsmith_client, tracing_enabled, LANGSMITH_PROJECT

logger = logging.getLogger("graphrag.evaluate")
EVAL_QUESTIONS_PATH = Path(__file__).parent / "eval_questions.json"


def load_eval_questions() -> List[Dict[str, Any]]:
    """Read evaluation question benchmarks from disk."""
    if not EVAL_QUESTIONS_PATH.exists():
        return []
    with open(EVAL_QUESTIONS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def run_evaluation_suite(limit: int = 5) -> Dict[str, Any]:
    """Execute evaluation comparing Baseline Vector RAG and GraphRAG on benchmark questions.

    Args:
        limit: Number of questions to run (defaults to 5 to finish in reasonable time on 3B local LLM)

    Returns:
        Structured evaluation comparison with metrics and LangSmith experiment links.
    """
    questions = load_eval_questions()[:limit]

    baseline_metrics = {"groundedness": [], "correctness": [], "context_hit": []}
    graphrag_metrics = {"groundedness": [], "correctness": [], "context_hit": []}
    detailed_results = []

    for item in questions:
        q_text = item["question"]
        ref_text = item["ground_truth"]
        q_type = item.get("type", "auto")

        # 1. Run Baseline
        base_res = run_baseline_search(q_text)
        base_ctx = "\n".join([c.get("text", "") for c in base_res["sources"]["chunks"]])
        base_g = judge_groundedness(base_res["answer"], base_ctx)
        base_c = judge_correctness(q_text, base_res["answer"], ref_text)
        base_hit = compute_context_hit(ref_text, base_res["sources"]["chunks"], [])

        baseline_metrics["groundedness"].append(base_g.score)
        baseline_metrics["correctness"].append(base_c.score)
        baseline_metrics["context_hit"].append(base_hit)

        # 2. Run GraphRAG (hybrid / routed)
        if q_type == "global":
            grag_res = run_global_search(q_text)
        elif q_type == "local":
            grag_res = run_local_search(q_text)
        else:
            mode = route_query(q_text)
            grag_res = run_global_search(q_text) if mode == "global" else run_local_search(q_text)

        grag_ctx = "\n".join(
            [c.get("text", "") for c in grag_res["sources"]["chunks"]] +
            grag_res["sources"]["entities"] +
            grag_res["sources"]["paths"]
        )
        grag_g = judge_groundedness(grag_res["answer"], grag_ctx)
        grag_c = judge_correctness(q_text, grag_res["answer"], ref_text)
        grag_hit = compute_context_hit(
            ref_text,
            grag_res["sources"]["chunks"],
            grag_res["sources"]["entities"]
        )

        graphrag_metrics["groundedness"].append(grag_g.score)
        graphrag_metrics["correctness"].append(grag_c.score)
        graphrag_metrics["context_hit"].append(grag_hit)

        detailed_results.append({
            "id": item.get("id"),
            "question": q_text,
            "type": q_type,
            "baseline": {
                "answer": base_res["answer"],
                "groundedness": base_g.score,
                "correctness": base_c.score,
                "context_hit": base_hit,
            },
            "graphrag": {
                "answer": grag_res["answer"],
                "mode": grag_res["mode_used"],
                "groundedness": grag_g.score,
                "correctness": grag_c.score,
                "context_hit": grag_hit,
            }
        })

    def _avg(lst: List[float]) -> float:
        return round(sum(lst) / len(lst), 3) if lst else 0.0

    scores_summary = {
        "baseline": {
            "groundedness": _avg(baseline_metrics["groundedness"]),
            "correctness": _avg(baseline_metrics["correctness"]),
            "context_hit": _avg(baseline_metrics["context_hit"]),
            "samples_evaluated": len(questions),
        },
        "graphrag": {
            "groundedness": _avg(graphrag_metrics["groundedness"]),
            "correctness": _avg(graphrag_metrics["correctness"]),
            "context_hit": _avg(graphrag_metrics["context_hit"]),
            "samples_evaluated": len(questions),
        }
    }

    # LangSmith project links if enabled
    baseline_url = None
    graphrag_url = None
    if tracing_enabled:
        baseline_url = f"https://smith.langchain.com/projects/p/{LANGSMITH_PROJECT}?tab=runs"
        graphrag_url = f"https://smith.langchain.com/projects/p/{LANGSMITH_PROJECT}?tab=runs"

    return {
        "baseline_url": baseline_url,
        "graphrag_url": graphrag_url,
        "scores": scores_summary,
        "details": detailed_results,
    }

