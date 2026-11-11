"""Local search pipeline: entity matching, graph neighborhood expansion, chunk retrieval, and grounded answer synthesis."""

import networkx as nx
from typing import Dict, Any, List, Set, Tuple

from backend.pipeline.stores import store
from backend.tracing import traceable
from models.prompts import LOCAL_ANSWER_SYSTEM, LOCAL_ANSWER_USER_TEMPLATE
from models.llm import get_llm


@traceable(name="retrieve_entities", run_type="retriever")
def retrieve_entities(question: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Retrieve top-k relevant entities using FAISS entity vector index."""
    results = store.entities_faiss.search(question, top_k=top_k)
    return [meta for meta, score in results]


@traceable(name="expand_graph", run_type="chain")
def expand_graph(
    seed_entities: List[Dict[str, Any]],
    hops: int = 2,
    max_nodes: int = 40,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[str], Set[str]]:
    """Traverse graph around seed entities up to specified hops.

    Returns:
        nodes_data: list of node dicts for subgraph
        links_data: list of edge dicts for subgraph
        relation_paths: list of descriptive strings representing relationship walks
        associated_chunk_ids: set of chunk ids linked to traversed nodes and edges
    """
    G = store.load_graph()
    visited_nodes: Set[str] = set()
    frontier: Set[str] = set()

    for ent in seed_entities:
        name = ent.get("name")
        if name and G.has_node(name):
            frontier.add(name)
            visited_nodes.add(name)

    # Breadth-first graph expansion up to hops
    for _ in range(hops):
        next_frontier = set()
        for node in frontier:
            for neighbor in G.neighbors(node):
                if neighbor not in visited_nodes and len(visited_nodes) < max_nodes:
                    visited_nodes.add(neighbor)
                    next_frontier.add(neighbor)
        frontier = next_frontier
        if not frontier or len(visited_nodes) >= max_nodes:
            break

    # Extract induced subgraph
    subgraph = G.subgraph(visited_nodes)

    nodes_data: List[Dict[str, Any]] = []
    associated_chunk_ids: Set[str] = set()

    for node_id in subgraph.nodes():
        attrs = G.nodes[node_id]
        nodes_data.append({
            "id": str(node_id),
            "label": attrs.get("label", str(node_id)),
            "type": attrs.get("type", "CONCEPT"),
            "community": attrs.get("community", -1),
            "description": attrs.get("description", ""),
        })
        for cid in attrs.get("chunk_ids", []):
            associated_chunk_ids.add(cid)

    links_data: List[Dict[str, Any]] = []
    relation_paths: List[str] = []

    for u, v, attrs in subgraph.edges(data=True):
        rel = attrs.get("relation", "RELATED_TO")
        desc = attrs.get("description", "")
        links_data.append({
            "source": str(u),
            "target": str(v),
            "relation": rel,
        })
        desc_str = f" ({desc})" if desc else ""
        relation_paths.append(f"{u} -> {rel} -> {v}{desc_str}")

        for cid in attrs.get("chunk_ids", []):
            associated_chunk_ids.add(cid)

    return nodes_data, links_data, relation_paths, associated_chunk_ids


@traceable(name="generate_answer", run_type="chain")
def generate_local_answer(
    question: str,
    entities_text: str,
    relations_text: str,
    chunks_text: str,
) -> str:
    """Generate factually grounded answer strictly from local context."""
    llm = get_llm(json_mode=False)
    user_prompt = LOCAL_ANSWER_USER_TEMPLATE.format(
        question=question,
        entities=entities_text or "No specific entities identified.",
        relationships=relations_text or "No direct relationships identified.",
        chunks=chunks_text or "No supporting text chunks found.",
    )

    messages = [
        ("system", LOCAL_ANSWER_SYSTEM),
        ("human", user_prompt),
    ]

    response = llm.invoke(messages)
    return response.content if hasattr(response, "content") else str(response)


@traceable(name="local_search", run_type="chain")
def run_local_search(
    question: str,
    k: int = 5,
    hops: int = 2,
) -> Dict[str, Any]:
    """Execute end-to-end Local GraphRAG search.

    Returns dict with answer, sources, subgraph, and mode.
    """
    # 1. Retrieve top-k entities
    seed_entities = retrieve_entities(question, top_k=k)

    # 2. Expand graph neighborhood
    subgraph_nodes, subgraph_links, relation_paths, chunk_ids = expand_graph(
        seed_entities, hops=hops, max_nodes=35
    )

    # 3. Retrieve text for associated chunk IDs (plus top chunks from FAISS for coverage)
    all_chunks = store.load_chunks()
    chunk_by_id = {c["id"]: c for c in all_chunks}

    retrieved_chunks: List[Dict[str, Any]] = []
    for cid in list(chunk_ids)[:6]:
        if cid in chunk_by_id:
            c = chunk_by_id[cid]
            retrieved_chunks.append({
                "id": c["id"],
                "text": c["text"],
                "file": c.get("file", "unknown"),
            })

    # If entity graph didn't yield chunks, query FAISS chunks directly
    if not retrieved_chunks:
        direct_chunks = store.chunks_faiss.search(question, top_k=3)
        for c_meta, _ in direct_chunks:
            retrieved_chunks.append({
                "id": c_meta.get("id", "c_direct"),
                "text": c_meta.get("text", ""),
                "file": c_meta.get("file", "unknown"),
            })

    # Format context strings for LLM
    entities_summary = "\n".join([
        f"- {n['id']} ({n['type']}): {n['description']}"
        for n in subgraph_nodes[:15]
    ])
    relations_summary = "\n".join([f"- {p}" for p in relation_paths[:20]])
    chunks_summary = "\n\n".join([
        f"[{c['file']} / {c['id']}]:\n{c['text']}"
        for c in retrieved_chunks[:4]
    ])

    # 4. Generate grounded answer
    answer = generate_local_answer(
        question=question,
        entities_text=entities_summary,
        relations_text=relations_summary,
        chunks_text=chunks_summary,
    )

    return {
        "answer": answer.strip(),
        "mode_used": "local",
        "sources": {
            "entities": [n["id"] for n in subgraph_nodes[:10]],
            "paths": relation_paths[:10],
            "chunks": retrieved_chunks,
        },
        "subgraph": {
            "nodes": subgraph_nodes,
            "links": subgraph_links,
        },
    }

