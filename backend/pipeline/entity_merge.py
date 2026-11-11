"""Entity normalization and deduplication via string matching and embedding cosine similarity."""

import re
import numpy as np
from typing import List, Dict, Any, Tuple
from models.schemas import Entity
from models.llm import get_embeddings
from backend.tracing import traceable


def _normalize_name(name: str) -> str:
    """Normalize entity name for baseline comparison."""
    cleaned = re.sub(r"[^\w\s]", "", name.strip().lower())
    return " ".join(cleaned.split())


def _cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    """Compute cosine similarity between two 1D vectors."""
    dot = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(dot / (norm1 * norm2))


@traceable(name="merge_entities", run_type="chain")
def merge_extracted_entities(
    chunk_extractions: List[Tuple[str, List[Entity]]],
    similarity_threshold: float = 0.90,
) -> Tuple[Dict[str, Dict[str, Any]], Dict[str, str]]:
    """Normalize and deduplicate entities across chunks using string rules and embedding similarity.

    Args:
        chunk_extractions: list of tuples (chunk_id, list of extracted Entity objects)
        similarity_threshold: cosine similarity cutoff (default 0.90)

    Returns:
        A tuple of:
        1. merged_entities: dict keyed by canonical_name with properties:
           {name, type, description, chunk_ids, aliases}
        2. alias_map: dict mapping every raw entity name to its canonical_name
    """
    raw_entities_by_norm: Dict[str, List[Tuple[Entity, str]]] = {}
    alias_map: Dict[str, str] = {}

    # Stage 1: Group by basic normalized string
    for chunk_id, entities in chunk_extractions:
        for ent in entities:
            norm = _normalize_name(ent.name)
            if not norm:
                continue
            if norm not in raw_entities_by_norm:
                raw_entities_by_norm[norm] = []
            raw_entities_by_norm[norm].append((ent, chunk_id))

    # Stage 2: Initial canonical candidate selection
    cluster_canonical: List[str] = []
    cluster_data: Dict[str, Dict[str, Any]] = {}

    for norm, ent_tuples in raw_entities_by_norm.items():
        # Pick the most frequent or longest capitalized original name as candidate
        original_names = [e.name for e, _ in ent_tuples]
        canonical_display = max(set(original_names), key=lambda x: (original_names.count(x), len(x)))

        types = [e.type for e, _ in ent_tuples if e.type and e.type != "CONCEPT"]
        chosen_type = types[0] if types else "CONCEPT"

        descriptions = [e.description for e, _ in ent_tuples if e.description.strip()]
        unique_descs = list(dict.fromkeys(descriptions))
        merged_desc = " ".join(unique_descs)

        chunk_ids = list(set(cid for _, cid in ent_tuples))

        cluster_canonical.append(canonical_display)
        cluster_data[canonical_display] = {
            "name": canonical_display,
            "type": chosen_type,
            "description": merged_desc,
            "chunk_ids": chunk_ids,
            "aliases": set(original_names),
        }
        for name in original_names:
            alias_map[name] = canonical_display

    # Stage 3: Embedding-based merge for remaining high-similarity pairs (> 0.90)
    if len(cluster_canonical) > 1:
        try:
            embeddings_model = get_embeddings()
            names_list = cluster_canonical
            embeddings = embeddings_model.embed_documents(names_list)
            emb_matrix = np.array(embeddings, dtype=np.float32)

            merged_into: Dict[str, str] = {}

            for i in range(len(names_list)):
                name_i = names_list[i]
                target_i = merged_into.get(name_i, name_i)
                if target_i != name_i:
                    continue

                for j in range(i + 1, len(names_list)):
                    name_j = names_list[j]
                    target_j = merged_into.get(name_j, name_j)
                    if target_j != name_j:
                        continue

                    # Check string containment (e.g. "Apple Inc." and "Apple")
                    norm_i = _normalize_name(name_i)
                    norm_j = _normalize_name(name_j)
                    is_contained = (norm_i in norm_j) or (norm_j in norm_i)

                    sim = _cosine_similarity(emb_matrix[i], emb_matrix[j])

                    if sim >= similarity_threshold or (is_contained and sim >= 0.82):
                        # Merge j into i
                        merged_into[name_j] = target_i
                        data_i = cluster_data[target_i]
                        data_j = cluster_data[name_j]

                        data_i["aliases"].update(data_j["aliases"])
                        data_i["chunk_ids"] = list(set(data_i["chunk_ids"] + data_j["chunk_ids"]))
                        if data_j["description"] and data_j["description"] not in data_i["description"]:
                            data_i["description"] = f"{data_i['description']} {data_j['description']}".strip()
                        if data_i["type"] == "CONCEPT" and data_j["type"] != "CONCEPT":
                            data_i["type"] = data_j["type"]

            # Update alias map and final merged dictionary
            final_entities: Dict[str, Dict[str, Any]] = {}
            for name, data in cluster_data.items():
                if name in merged_into:
                    canonical = merged_into[name]
                    # Update all aliases that mapped to name
                    for a in data["aliases"]:
                        alias_map[a] = canonical
                else:
                    data["aliases"] = list(data["aliases"])
                    final_entities[name] = data

            # Propagate alias mappings to final keys
            for raw_k, canon_k in list(alias_map.items()):
                curr = canon_k
                while curr in merged_into:
                    curr = merged_into[curr]
                alias_map[raw_k] = curr

            return final_entities, alias_map

        except Exception as e:
            # Fall back to string-clustered entities if embeddings call encounters issue
            pass

    # Ensure aliases sets are serialized to lists
    for k in cluster_data:
        cluster_data[k]["aliases"] = list(cluster_data[k]["aliases"])

    return cluster_data, alias_map

