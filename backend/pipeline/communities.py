"""Community detection using NetworkX Louvain algorithm and hierarchical LLM summarization."""

import json
import logging
import networkx as nx
from typing import Dict, Any, List, Set
from models.prompts import (
    COMMUNITY_SUMMARY_SYSTEM,
    COMMUNITY_SUMMARY_USER_TEMPLATE,
)
from models.llm import get_llm
from models.cache import disk_cache
from backend.tracing import traceable

logger = logging.getLogger("graphrag.communities")


def _clean_json_output(raw_text: str) -> str:
    """Clean markdown backticks from JSON string."""
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


@traceable(name="detect_communities", run_type="chain")
def detect_communities(G: nx.Graph, seed: int = 42) -> List[Set[str]]:
    """Detect Louvain communities on the graph with a deterministic random seed.

    Returns a list of node sets, ordered from largest community to smallest.
    """
    if len(G.nodes) == 0:
        return []

    # If graph has no edges, each node is its own community
    if len(G.edges) == 0:
        return [{n} for n in G.nodes]

    try:
        communities = nx.community.louvain_communities(G, seed=seed)
        # Sort by community size descending
        sorted_communities = sorted(communities, key=len, reverse=True)
        return sorted_communities
    except Exception as e:
        logger.warning("Louvain community detection failed (%s); using connected components fallback.", e)
        components = list(nx.connected_components(G))
        return sorted(components, key=len, reverse=True)


@traceable(name="summarize_community", run_type="chain")
def summarize_community(
    community_id: int,
    nodes: List[str],
    G: nx.Graph,
    use_cache: bool = True,
) -> Dict[str, Any]:
    """Generate title and 4-6 sentence summary for a community of nodes.

    For communities with 3+ nodes, calls local Ollama LLM with structured prompt.
    For small communities (<3 nodes), generates a concise factual fallback summary.
    """
    # Collect entity details
    entities_lines = []
    for node in nodes:
        node_attrs = G.nodes.get(node, {})
        desc = node_attrs.get("description", "")
        ntype = node_attrs.get("type", "CONCEPT")
        entities_lines.append(f"- {node} ({ntype}): {desc}")

    # Collect internal relations
    relations_lines = []
    node_set = set(nodes)
    for u, v, attrs in G.edges(nodes, data=True):
        if u in node_set and v in node_set:
            rel = attrs.get("relation", "RELATED_TO")
            desc = attrs.get("description", "")
            relations_lines.append(f"- {u} -> {rel} -> {v} ({desc})")

    entities_text = "\n".join(entities_lines[:25])  # Cap to prevent context blowup
    relations_text = "\n".join(relations_lines[:25]) if relations_lines else "None recorded."

    # For tiny communities (< 3 nodes), generate programmatic summary
    if len(nodes) < 3:
        title = ", ".join(nodes)
        summary = (
            f"This small cluster consists of {len(nodes)} entity(s): {', '.join(nodes)}. "
            f"Key descriptions: {' '.join([G.nodes[n].get('description', '') for n in nodes if G.nodes[n].get('description')][:2])}"
        )
        return {
            "id": community_id,
            "title": title[:60],
            "summary": summary.strip(),
            "nodes": nodes,
            "node_count": len(nodes),
        }

    user_prompt = COMMUNITY_SUMMARY_USER_TEMPLATE.format(
        community_id=community_id,
        entities_text=entities_text,
        relations_text=relations_text,
    )
    cache_key = f"comm_summary_{community_id}_{len(nodes)}"

    if use_cache:
        cached = disk_cache.get(user_prompt, extra=cache_key)
        if cached:
            try:
                parsed = json.loads(_clean_json_output(cached))
                return {
                    "id": community_id,
                    "title": parsed.get("title", f"Community {community_id}"),
                    "summary": parsed.get("summary", ""),
                    "nodes": nodes,
                    "node_count": len(nodes),
                }
            except Exception:
                pass

    llm = get_llm(json_mode=True)
    messages = [
        ("system", COMMUNITY_SUMMARY_SYSTEM),
        ("human", user_prompt),
    ]

    try:
        response = llm.invoke(messages)
        raw_content = response.content if hasattr(response, "content") else str(response)
        parsed = json.loads(_clean_json_output(raw_content))

        title = parsed.get("title", f"Cluster: {', '.join(nodes[:3])}")
        summary = parsed.get("summary", f"Community of {len(nodes)} interconnected entities including {', '.join(nodes[:4])}.")

        if use_cache and summary:
            disk_cache.set(user_prompt, raw_content, extra=cache_key)

        return {
            "id": community_id,
            "title": title,
            "summary": summary,
            "nodes": nodes,
            "node_count": len(nodes),
        }

    except Exception as err:
        logger.warning("Community %d LLM summary failed: %s; using fallback.", community_id, err)
        return {
            "id": community_id,
            "title": f"Community {community_id}: {', '.join(nodes[:3])}",
            "summary": f"Cluster containing {len(nodes)} entities: {', '.join(nodes)}. Entities play interconnected roles in this topic area.",
            "nodes": nodes,
            "node_count": len(nodes),
        }

