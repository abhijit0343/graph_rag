"""Global search pipeline: community map-reduce aggregation for macro thematic queries."""

import json
import logging
from typing import Dict, Any, List
from backend.pipeline.stores import store
from backend.tracing import traceable
from models.prompts import (
    MAP_SYSTEM,
    MAP_USER_TEMPLATE,
    REDUCE_SYSTEM,
    REDUCE_USER_TEMPLATE,
)
from models.schemas import MapAnswer
from models.llm import get_llm

logger = logging.getLogger("graphrag.global_search")


def _clean_json(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()


@traceable(name="map_community_answer", run_type="chain")
def map_community_answer(question: str, community: Dict[str, Any]) -> MapAnswer:
    """Evaluate one community report and generate a scored partial answer."""
    llm = get_llm(json_mode=True)
    user_prompt = MAP_USER_TEMPLATE.format(
        question=question,
        title=community.get("title", f"Community {community.get('id')}"),
        summary=community.get("summary", ""),
    )

    messages = [
        ("system", MAP_SYSTEM),
        ("human", user_prompt),
    ]

    try:
        response = llm.invoke(messages)
        content = response.content if hasattr(response, "content") else str(response)
        parsed = json.loads(_clean_json(content))
        return MapAnswer.model_validate(parsed)
    except Exception as e:
        logger.warning("Map failed for community %s: %s", community.get("id"), e)
        return MapAnswer(answer="IRRELEVANT", score=0, reasoning=str(e))


@traceable(name="reduce_answers", run_type="chain")
def reduce_answers(question: str, scored_findings: List[Dict[str, Any]]) -> str:
    """Synthesize top ranked community findings into a cohesive editorial answer."""
    if not scored_findings:
        return "The documents do not contain sufficient global context to answer this question."

    formatted_findings = "\n\n".join([
        f"[Community '{f['title']}' (Score: {f['score']}/100)]:\n{f['answer']}"
        for f in scored_findings
    ])

    llm = get_llm(json_mode=False)
    user_prompt = REDUCE_USER_TEMPLATE.format(
        question=question,
        findings=formatted_findings,
    )

    messages = [
        ("system", REDUCE_SYSTEM),
        ("human", user_prompt),
    ]

    try:
        response = llm.invoke(messages)
        return response.content if hasattr(response, "content") else str(response)
    except Exception as e:
        logger.error("Reduce synthesis failed: %s", e)
        return "Failed to synthesize global community findings into a final answer."


@traceable(name="global_search", run_type="chain")
def run_global_search(question: str, top_k_communities: int = 6) -> Dict[str, Any]:
    """Execute end-to-end Global GraphRAG search over community reports."""
    comm_dict = store.load_communities()
    all_communities = list(comm_dict.values())

    if not all_communities:
        return {
            "answer": "No indexed communities available. Please index documents first.",
            "mode_used": "global",
            "sources": {"entities": [], "paths": [], "chunks": []},
            "subgraph": {"nodes": [], "links": []},
        }

    # If there are many communities, prioritize the top communities via community FAISS search
    candidate_communities: List[Dict[str, Any]] = []
    if len(all_communities) > top_k_communities:
        faiss_hits = store.communities_faiss.search(question, top_k=top_k_communities)
        candidate_communities = [meta for meta, _ in faiss_hits]
    else:
        candidate_communities = all_communities

    # Step 1: Map stage over candidate communities
    scored_findings: List[Dict[str, Any]] = []
    active_comm_ids = []

    for comm in candidate_communities:
        mapped = map_community_answer(question, comm)
        if mapped.score >= 25 and mapped.answer.strip().upper() != "IRRELEVANT":
            scored_findings.append({
                "community_id": comm.get("id"),
                "title": comm.get("title", ""),
                "score": mapped.score,
                "answer": mapped.answer,
                "reasoning": mapped.reasoning,
            })
            active_comm_ids.append(comm.get("id"))

    # Sort descending by score
    scored_findings.sort(key=lambda x: x["score"], reverse=True)

    # Step 2: Reduce stage
    final_answer = reduce_answers(question, scored_findings[:5])

    # Step 3: Extract subgraph nodes and links representing the relevant communities
    G = store.load_graph()
    relevant_nodes = []
    for node_id, attrs in G.nodes(data=True):
        if attrs.get("community") in active_comm_ids:
            relevant_nodes.append(node_id)

    # Restrict to reasonable visual size (max 50 nodes)
    subgraph_node_ids = set(relevant_nodes[:50])
    subgraph = G.subgraph(subgraph_node_ids)

    subgraph_nodes = [
        {
            "id": str(n),
            "label": G.nodes[n].get("label", str(n)),
            "type": G.nodes[n].get("type", "CONCEPT"),
            "community": G.nodes[n].get("community", -1),
            "description": G.nodes[n].get("description", ""),
        }
        for n in subgraph.nodes()
    ]

    subgraph_links = [
        {
            "source": str(u),
            "target": str(v),
            "relation": attrs.get("relation", "RELATED_TO"),
        }
        for u, v, attrs in subgraph.edges(data=True)
    ]

    # Gather entity names and paths
    source_entities = [n["id"] for n in subgraph_nodes[:15]]
    paths = [
        f"{f['title']} (Relevance: {f['score']}%)" for f in scored_findings[:6]
    ]

    # Include sample source chunks from top communities
    all_chunks = store.load_chunks()
    sample_chunks = []
    chunk_dict = {c["id"]: c for c in all_chunks}
    for n in subgraph_nodes[:5]:
        for cid in G.nodes[n["id"]].get("chunk_ids", []):
            if cid in chunk_dict and len(sample_chunks) < 4:
                sample_chunks.append({
                    "id": cid,
                    "text": chunk_dict[cid]["text"],
                    "file": chunk_dict[cid].get("file", ""),
                })

    return {
        "answer": final_answer.strip(),
        "mode_used": "global",
        "sources": {
            "entities": source_entities,
            "paths": paths,
            "chunks": sample_chunks,
        },
        "subgraph": {
            "nodes": subgraph_nodes,
            "links": subgraph_links,
        },
    }

