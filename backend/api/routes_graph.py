"""Graph visualizer and statistics routes."""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException

from backend.pipeline.stores import store

router = APIRouter(tags=["Graph"])


@router.get("/graph/stats")
def get_graph_stats():
    """Retrieve high-level graph metrics: total nodes, edges, and detected communities."""
    if not store.has_index():
        return {"nodes": 0, "edges": 0, "communities": 0}

    G = store.load_graph()
    comm_dict = store.load_communities()

    return {
        "nodes": G.number_of_nodes(),
        "edges": G.number_of_edges(),
        "communities": len(comm_dict),
    }


@router.get("/graph")
def get_graph_data(community: Optional[int] = Query(None, description="Optional community ID filter")):
    """Retrieve full graph or community-filtered subgraph nodes and links."""
    if not store.has_index():
        return {"nodes": [], "links": []}

    G = store.load_graph()

    # Filter by community if requested
    target_nodes = set()
    if community is not None:
        for node, attrs in G.nodes(data=True):
            if attrs.get("community") == community:
                target_nodes.add(node)
        subG = G.subgraph(target_nodes)
    else:
        subG = G

    nodes = []
    for node_id, attrs in subG.nodes(data=True):
        nodes.append({
            "id": str(node_id),
            "label": attrs.get("label", str(node_id)),
            "type": attrs.get("type", "CONCEPT"),
            "description": attrs.get("description", ""),
            "community": attrs.get("community", -1),
        })

    links = []
    for u, v, attrs in subG.edges(data=True):
        links.append({
            "source": str(u),
            "target": str(v),
            "relation": attrs.get("relation", "RELATED_TO"),
            "description": attrs.get("description", ""),
        })

    return {"nodes": nodes, "links": links}

