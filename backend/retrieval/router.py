"""Query router determining whether a query demands local or global GraphRAG retrieval."""

import json
import logging
from models.schemas import Route
from models.prompts import ROUTER_SYSTEM, ROUTER_USER_TEMPLATE
from models.llm import get_llm
from backend.tracing import traceable

logger = logging.getLogger("graphrag.router")


@traceable(name="route_query", run_type="chain")
def route_query(question: str) -> str:
    """Analyze query semantics and select retrieval strategy: 'local' or 'global'.

    Args:
        question: User query string

    Returns:
        'local' or 'global'
    """
    prompt = ROUTER_USER_TEMPLATE.format(query=question.strip())
    llm = get_llm(json_mode=True)

    messages = [
        ("system", ROUTER_SYSTEM),
        ("human", prompt),
    ]

    try:
        response = llm.invoke(messages)
        content = response.content if hasattr(response, "content") else str(response)

        # Clean markdown wrappers if any
        text = content.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        parsed = json.loads(text.strip())
        route = Route.model_validate(parsed)
        logger.info("Router decision for '%s': %s (reason: %s)", question, route.choice, route.reasoning)
        return route.choice

    except Exception as e:
        logger.warning("Routing failed for '%s' (%s); defaulting to 'local'", question, e)
        # Default heuristic fallback: words like 'theme', 'summary', 'overall', 'across' -> global
        q_lower = question.lower()
        if any(w in q_lower for w in ["theme", "overall", "summarize", "summary", "across", "main topics", "compare all"]):
            return "global"
        return "local"

