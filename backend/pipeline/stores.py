"""Storage managers for Graph, Chunks, Communities, and 3 FAISS Vector Indexes."""

import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import faiss
import numpy as np
import networkx as nx

from backend.config import (
    STORAGE_DIR,
    FAISS_DIR,
    GRAPH_PATH,
    COMMUNITIES_PATH,
    CHUNKS_PATH,
    ENTITIES_PATH,
)
from backend.pipeline.graph_build import graph_to_dict
from models.llm import get_embeddings


class FAISSStore:
    """Manages an individual FAISS index with L2-normalized cosine search and metadata."""

    def __init__(self, name: str, base_dir: Path = FAISS_DIR):
        self.name = name
        self.index_path = base_dir / f"{name}.index"
        self.meta_path = base_dir / f"{name}_meta.json"
        self.index: Optional[faiss.IndexFlatIP] = None
        self.metadata: List[Dict[str, Any]] = []

    def build_and_save(self, texts: List[str], metadatas: List[Dict[str, Any]]) -> None:
        """Embed texts, normalize, build IndexFlatIP (cosine), and persist to disk."""
        if not texts:
            self.metadata = []
            return

        embedder = get_embeddings()
        embeddings = embedder.embed_documents(texts)
        matrix = np.array(embeddings, dtype=np.float32)

        # L2-normalize vectors for cosine similarity via inner product
        faiss.normalize_L2(matrix)
        dimension = matrix.shape[1]

        index = faiss.IndexFlatIP(dimension)
        index.add(matrix)

        self.index = index
        self.metadata = metadatas

        # Persist index
        faiss.write_index(index, str(self.index_path))
        with open(self.meta_path, "w", encoding="utf-8") as f:
            json.dump(metadatas, f, ensure_ascii=False, indent=2)

    def load(self) -> bool:
        """Load FAISS index and metadata from disk if available."""
        if self.index_path.exists() and self.meta_path.exists():
            try:
                self.index = faiss.read_index(str(self.index_path))
                with open(self.meta_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                return True
            except Exception:
                return False
        return False

    def search(self, query: str, top_k: int = 5) -> List[Tuple[Dict[str, Any], float]]:
        """Search top-k most similar entries for a query string."""
        if self.index is None:
            if not self.load():
                return []

        if self.index.ntotal == 0 or len(self.metadata) == 0:
            return []

        embedder = get_embeddings()
        q_emb = embedder.embed_query(query)
        q_vec = np.array([q_emb], dtype=np.float32)
        faiss.normalize_L2(q_vec)

        k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(q_vec, k)

        results: List[Tuple[Dict[str, Any], float]] = []
        for idx, score in zip(indices[0], scores[0]):
            if idx != -1 and idx < len(self.metadata):
                results.append((self.metadata[idx], float(score)))

        return results


class GraphRAGStore:
    """Central store coordinating JSON files and the 3 FAISS indexes (chunks, entities, communities)."""

    def __init__(self):
        self.chunks_faiss = FAISSStore("chunks")
        self.entities_faiss = FAISSStore("entities")
        self.communities_faiss = FAISSStore("communities")
        self._graph: Optional[nx.Graph] = None
        self._communities: Optional[Dict[str, Any]] = None
        self._chunks: Optional[List[Dict[str, Any]]] = None
        self._entities: Optional[Dict[str, Any]] = None

    def has_index(self) -> bool:
        """Check if pre-built indexes exist on disk."""
        return GRAPH_PATH.exists() and CHUNKS_PATH.exists()

    def save_all(
        self,
        G: nx.Graph,
        chunks: List[Dict[str, Any]],
        entities: Dict[str, Dict[str, Any]],
        communities: List[Dict[str, Any]],
    ) -> None:
        """Persist graph structure, chunks, communities, and FAISS vector indices."""
        STORAGE_DIR.mkdir(parents=True, exist_ok=True)

        # 1. Save Graph JSON
        g_data = graph_to_dict(G)
        with open(GRAPH_PATH, "w", encoding="utf-8") as f:
            json.dump(g_data, f, ensure_ascii=False, indent=2)
        self._graph = G

        # 2. Save Chunks JSON & Vector Index
        with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
            json.dump(chunks, f, ensure_ascii=False, indent=2)
        self._chunks = chunks
        chunk_texts = [c["text"] for c in chunks]
        self.chunks_faiss.build_and_save(chunk_texts, chunks)

        # 3. Save Entities JSON & Vector Index
        with open(ENTITIES_PATH, "w", encoding="utf-8") as f:
            json.dump(entities, f, ensure_ascii=False, indent=2)
        self._entities = entities
        entity_texts = [f"{e['name']}: {e.get('description', '')}" for e in entities.values()]
        entity_metas = list(entities.values())
        self.entities_faiss.build_and_save(entity_texts, entity_metas)

        # 4. Save Communities JSON & Vector Index
        comm_dict = {str(c["id"]): c for c in communities}
        with open(COMMUNITIES_PATH, "w", encoding="utf-8") as f:
            json.dump(comm_dict, f, ensure_ascii=False, indent=2)
        self._communities = comm_dict
        comm_texts = [f"{c['title']}\n{c['summary']}" for c in communities]
        self.communities_faiss.build_and_save(comm_texts, communities)

    def load_graph(self) -> nx.Graph:
        """Load NetworkX graph from JSON."""
        if self._graph is not None:
            return self._graph

        G = nx.Graph()
        if not GRAPH_PATH.exists():
            return G

        with open(GRAPH_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        for n in data.get("nodes", []):
            G.add_node(
                n["id"],
                label=n.get("label", n["id"]),
                type=n.get("type", "CONCEPT"),
                description=n.get("description", ""),
                community=n.get("community", -1),
                chunk_ids=n.get("chunk_ids", []),
            )

        for e in data.get("links", []):
            G.add_edge(
                e["source"],
                e["target"],
                relation=e.get("relation", "RELATED_TO"),
                description=e.get("description", ""),
                weight=float(e.get("weight", 1.0)),
            )

        self._graph = G
        return G

    def load_chunks(self) -> List[Dict[str, Any]]:
        """Load chunk records."""
        if self._chunks is not None:
            return self._chunks
        if not CHUNKS_PATH.exists():
            return []
        with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
            self._chunks = json.load(f)
        return self._chunks

    def load_entities(self) -> Dict[str, Any]:
        """Load canonical entities."""
        if self._entities is not None:
            return self._entities
        if not ENTITIES_PATH.exists():
            return {}
        with open(ENTITIES_PATH, "r", encoding="utf-8") as f:
            self._entities = json.load(f)
        return self._entities

    def load_communities(self) -> Dict[str, Any]:
        """Load community summaries."""
        if self._communities is not None:
            return self._communities
        if not COMMUNITIES_PATH.exists():
            return {}
        with open(COMMUNITIES_PATH, "r", encoding="utf-8") as f:
            self._communities = json.load(f)
        return self._communities


# Singleton store instance
store = GraphRAGStore()

