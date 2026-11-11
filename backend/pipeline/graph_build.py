"""Graph construction module using NetworkX with node and edge attribute integration."""

import networkx as nx
from typing import Dict, Any, List, Tuple
from models.schemas import Relation


def build_knowledge_graph(
    merged_entities: Dict[str, Dict[str, Any]],
    chunk_relations: List[Tuple[str, List[Relation]]],
    alias_map: Dict[str, str],
) -> nx.Graph:
    """Build an undirected NetworkX graph with rich node and edge attributes.

    Args:
        merged_entities: Canonical entities keyed by canonical name
        chunk_relations: List of (chunk_id, relations_list) tuples
        alias_map: Mapping from raw entity name to canonical entity name

    Returns:
        Populated nx.Graph instance
    """
    G = nx.Graph()

    # 1. Add Nodes
    for name, data in merged_entities.items():
        G.add_node(
            name,
            id=name,
            label=name,
            type=data.get("type", "CONCEPT"),
            description=data.get("description", ""),
            chunk_ids=data.get("chunk_ids", []),
            community=-1,  # Assigned in Louvain step
        )

    # 2. Add Edges with weight accumulation and canonical resolution
    for chunk_id, relations in chunk_relations:
        for rel in relations:
            src_raw = rel.source.strip()
            tgt_raw = rel.target.strip()

            src = alias_map.get(src_raw, src_raw)
            tgt = alias_map.get(tgt_raw, tgt_raw)

            # Avoid self-loops and missing endpoints
            if not src or not tgt or src == tgt:
                continue

            # Ensure both nodes exist in the graph even if missed in entity extraction
            if not G.has_node(src):
                G.add_node(src, id=src, label=src, type="CONCEPT", description="", chunk_ids=[chunk_id], community=-1)
            if not G.has_node(tgt):
                G.add_node(tgt, id=tgt, label=tgt, type="CONCEPT", description="", chunk_ids=[chunk_id], community=-1)

            rel_type = rel.relation.strip().upper() or "RELATED_TO"
            description = rel.description.strip()
            weight = float(rel.weight) if rel.weight else 1.0

            if G.has_edge(src, tgt):
                # Accumulate weight and merge descriptions
                edge_data = G[src][tgt]
                edge_data["weight"] += weight
                existing_descs = edge_data.get("descriptions", [])
                if description and description not in existing_descs:
                    existing_descs.append(description)
                edge_data["descriptions"] = existing_descs
                if description and not edge_data.get("description"):
                    edge_data["description"] = description
                cids = edge_data.get("chunk_ids", [])
                if chunk_id not in cids:
                    cids.append(chunk_id)
                edge_data["chunk_ids"] = cids
            else:
                G.add_edge(
                    src,
                    tgt,
                    relation=rel_type,
                    description=description,
                    descriptions=[description] if description else [],
                    weight=weight,
                    chunk_ids=[chunk_id],
                )

    return G


def graph_to_dict(G: nx.Graph) -> Dict[str, Any]:
    """Serialize NetworkX graph to JSON-compatible format for API and frontend."""
    nodes = []
    for node_id, attrs in G.nodes(data=True):
        nodes.append({
            "id": str(node_id),
            "label": attrs.get("label", str(node_id)),
            "type": attrs.get("type", "CONCEPT"),
            "description": attrs.get("description", ""),
            "community": attrs.get("community", -1),
            "chunk_ids": attrs.get("chunk_ids", []),
        })

    links = []
    for u, v, attrs in G.edges(data=True):
        links.append({
            "source": str(u),
            "target": str(v),
            "relation": attrs.get("relation", "RELATED_TO"),
            "description": attrs.get("description", ""),
            "weight": attrs.get("weight", 1.0),
        })

    return {"nodes": nodes, "links": links}

