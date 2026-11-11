"""Evaluators for Groundedness, Correctness (LLM judges), and Context Hit (code-based)."""

import json
import logging
import re
from typing import Dict, Any, List
from models.schemas import JudgeScore
from models.prompts import (
    JUDGE_GROUNDEDNESS_SYSTEM,
    JUDGE_GROUNDEDNESS_USER_TEMPLATE,
    JUDGE_CORRECTNESS_SYSTEM,
    JUDGE_CORRECTNESS_USER_TEMPLATE,
)
from models.llm import get_llm
from backend.tracing import traceable

logger = logging.getLogger("graphrag.evaluators")


def _clean_json(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()


@traceable(name="judge_groundedness", run_type="chain")
def judge_groundedness(answer: str, context: str) -> JudgeScore:
    """Evaluate whether answer claims are supported by context using local LLM judge."""
    if not answer.strip() or answer.strip().startswith("Information not found"):
        return JudgeScore(score=1.0, reasoning="Answer correctly reports lack of information without hallucinating.", passed=True)

    llm = get_llm(json_mode=True)
    user_prompt = JUDGE_GROUNDEDNESS_USER_TEMPLATE.format(context=context, answer=answer)

    messages = [
        ("system", JUDGE_GROUNDEDNESS_SYSTEM),
        ("human", user_prompt),
    ]

    try:
        response = llm.invoke(messages)
        content = response.content if hasattr(response, "content") else str(response)
        parsed = json.loads(_clean_json(content))
        return JudgeScore.model_validate(parsed)
    except Exception as e:
        logger.warning("Groundedness evaluation failed: %s; using heuristic fallback.", e)
        # Heuristic: check token overlap between answer and context
        ans_tokens = set(re.findall(r"\w{4,}", answer.lower()))
        ctx_tokens = set(re.findall(r"\w{4,}", context.lower()))
        overlap = len(ans_tokens & ctx_tokens) / max(len(ans_tokens), 1)
        score = min(1.0, round(overlap * 1.2, 2))
        return JudgeScore(score=score, reasoning=f"Fallback token overlap ({score})", passed=(score >= 0.70))


@traceable(name="judge_correctness", run_type="chain")
def judge_correctness(question: str, answer: str, reference: str) -> JudgeScore:
    """Evaluate semantic correctness of generated answer against reference ground truth."""
    llm = get_llm(json_mode=True)
    user_prompt = JUDGE_CORRECTNESS_USER_TEMPLATE.format(
        question=question,
        reference=reference,
        answer=answer,
    )

    messages = [
        ("system", JUDGE_CORRECTNESS_SYSTEM),
        ("human", user_prompt),
    ]

    try:
        response = llm.invoke(messages)
        content = response.content if hasattr(response, "content") else str(response)
        parsed = json.loads(_clean_json(content))
        return JudgeScore.model_validate(parsed)
    except Exception as e:
        logger.warning("Correctness evaluation failed: %s; using heuristic fallback.", e)
        ref_tokens = set(re.findall(r"\w{4,}", reference.lower()))
        ans_tokens = set(re.findall(r"\w{4,}", answer.lower()))
        overlap = len(ref_tokens & ans_tokens) / max(len(ref_tokens), 1)
        score = min(1.0, round(overlap, 2))
        return JudgeScore(score=score, reasoning=f"Fallback reference recall ({score})", passed=(score >= 0.70))


def compute_context_hit(ground_truth: str, retrieved_chunks: List[Dict[str, Any]], retrieved_entities: List[str]) -> float:
    """Code-based deterministic evaluator checking if key terms in ground truth appear in retrieved context."""
    gt_words = set(re.findall(r"[a-zA-Z]{4,}", ground_truth.lower()))
    if not gt_words:
        return 1.0

    collected_text = " ".join([c.get("text", "") for c in retrieved_chunks] + retrieved_entities).lower()
    hits = sum(1 for word in gt_words if word in collected_text)
    hit_ratio = hits / len(gt_words)
    return round(float(hit_ratio), 3)

