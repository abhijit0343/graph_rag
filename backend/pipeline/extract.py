"""Entity and relation extraction per document chunk using few-shot prompts and Ollama JSON mode."""

import json
import logging
from typing import Dict, Any, Optional
from models.schemas import Extraction, Entity, Relation
from models.prompts import (
    EXTRACTION_SYSTEM,
    EXTRACTION_USER_TEMPLATE,
    EXTRACTION_FEW_SHOT_INPUT,
    EXTRACTION_FEW_SHOT_OUTPUT,
)
from models.llm import get_llm
from models.cache import disk_cache
from backend.tracing import traceable

logger = logging.getLogger("graphrag.extract")


def _clean_json_output(raw_text: str) -> str:
    """Strip markdown code fence wrappers or stray characters from raw LLM text."""
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


@traceable(name="extract_graph_elements", run_type="chain")
def extract_from_chunk(
    chunk: Dict[str, Any],
    max_retries: int = 2,
    use_cache: bool = True,
) -> Extraction:
    """Extract entities and relations from a single text chunk with retry logic.

    Args:
        chunk: dict with 'id', 'text', 'file'
        max_retries: maximum parsing attempts before skipping
        use_cache: whether to use disk cache for responses

    Returns:
        Validated Extraction instance (or empty Extraction on persistent failure).
    """
    chunk_id = chunk.get("id", "unknown")
    chunk_text = chunk.get("text", "").strip()
    if not chunk_text:
        return Extraction(entities=[], relations=[])

    user_prompt = EXTRACTION_USER_TEMPLATE.format(chunk_text=chunk_text)
    cache_key = f"extract_v1_{chunk_id}"

    # Check disk cache
    if use_cache:
        cached_resp = disk_cache.get(user_prompt, extra=cache_key)
        if cached_resp:
            try:
                parsed = json.loads(_clean_json_output(cached_resp))
                return Extraction.model_validate(parsed)
            except Exception:
                pass  # Fall through to re-invoke

    llm = get_llm(json_mode=True)
    messages = [
        ("system", EXTRACTION_SYSTEM),
        ("human", f"Example chunk:\n{EXTRACTION_FEW_SHOT_INPUT}\n\nExample extraction:\n{EXTRACTION_FEW_SHOT_OUTPUT}"),
        ("human", user_prompt),
    ]

    for attempt in range(max_retries + 1):
        try:
            response = llm.invoke(messages)
            raw_content = response.content if hasattr(response, "content") else str(response)
            cleaned = _clean_json_output(raw_content)

            parsed_data = json.loads(cleaned)

            # Defensive cleanup: ensure entities and relations are lists
            if not isinstance(parsed_data, dict):
                raise ValueError("LLM response did not parse into a dictionary.")

            entities_raw = parsed_data.get("entities", [])
            relations_raw = parsed_data.get("relations", [])

            cleaned_entities = []
            for e in entities_raw:
                if isinstance(e, dict) and e.get("name"):
                    cleaned_entities.append(Entity(
                        name=str(e["name"]).strip(),
                        type=str(e.get("type", "CONCEPT")).strip().upper(),
                        description=str(e.get("description", "")).strip()
                    ))

            cleaned_relations = []
            for r in relations_raw:
                if isinstance(r, dict) and r.get("source") and r.get("target"):
                    cleaned_relations.append(Relation(
                        source=str(r["source"]).strip(),
                        target=str(r["target"]).strip(),
                        relation=str(r.get("relation", "RELATED_TO")).strip().upper(),
                        description=str(r.get("description", "")).strip(),
                        weight=float(r.get("weight", 1.0))
                    ))

            result = Extraction(entities=cleaned_entities, relations=cleaned_relations)

            # Cache successful response
            if use_cache and (len(result.entities) > 0 or len(result.relations) > 0):
                disk_cache.set(user_prompt, raw_content, extra=cache_key)

            return result

        except Exception as err:
            logger.warning(
                "Extraction attempt %d failed for chunk %s: %s",
                attempt + 1,
                chunk_id,
                err,
            )
            if attempt == max_retries:
                logger.error("Skipping chunk %s after %d failed extraction attempts.", chunk_id, max_retries + 1)

    return Extraction(entities=[], relations=[])

