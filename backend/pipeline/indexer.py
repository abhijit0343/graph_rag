"""Index orchestrator coordinating document ingestion, extraction, graph building, community summarization, and vector indexing."""

import logging
import threading
from typing import Dict, Any, List, Optional
from backend.config import UPLOAD_DIR, TRACE_INDEXING
from backend.pipeline.loaders import load_documents_from_dir
from backend.pipeline.chunking import chunk_documents
from backend.pipeline.extract import extract_from_chunk
from backend.pipeline.entity_merge import merge_extracted_entities
from backend.pipeline.graph_build import build_knowledge_graph
from backend.pipeline.communities import detect_communities, summarize_community
from backend.pipeline.stores import store
from backend.tracing import traceable, tracing_context

logger = logging.getLogger("graphrag.indexer")


class IndexStatusTracker:
    """Thread-safe status tracker for background indexing execution."""

    def __init__(self):
        self._lock = threading.Lock()
        self.reset()

    def reset(self):
        with self._lock:
            self.state: str = "idle"  # idle | running | done | error
            self.stage: str = "Awaiting documents"
            self.percent: int = 0
            self.counts: Dict[str, int] = {
                "chunks": 0,
                "entities": 0,
                "relations": 0,
                "communities": 0,
            }
            self.error: Optional[str] = None

    def update(
        self,
        state: Optional[str] = None,
        stage: Optional[str] = None,
        percent: Optional[int] = None,
        counts: Optional[Dict[str, int]] = None,
        error: Optional[str] = None,
    ):
        with self._lock:
            if state is not None:
                self.state = state
            if stage is not None:
                self.stage = stage
            if percent is not None:
                self.percent = percent
            if counts is not None:
                self.counts.update(counts)
            if error is not None:
                self.error = error

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "state": self.state,
                "stage": self.stage,
                "percent": self.percent,
                "counts": dict(self.counts),
                "error": self.error,
            }


index_tracker = IndexStatusTracker()


@traceable(name="index_corpus", run_type="chain")
def run_indexing_pipeline():
    """Execute the full GraphRAG indexing process with stage updates and selective LangSmith tracing."""
    index_tracker.update(state="running", stage="Loading documents", percent=5, error=None)

    try:
        # Step 1: Load documents
        docs = load_documents_from_dir(UPLOAD_DIR)
        if not docs:
            raise ValueError("No uploaded documents found in data/uploads. Please upload files before indexing.")

        # Step 2: Chunking (600 chars, 100 overlap, stable ids)
        index_tracker.update(stage="Chunking text", percent=15)
        chunks = chunk_documents(docs)
        if not chunks:
            raise ValueError("Could not create text chunks from uploaded files.")

        index_tracker.update(
            stage=f"Extracting entities & relations ({len(chunks)} chunks)",
            percent=20,
            counts={"chunks": len(chunks)}
        )

        # Step 3: Entity & Relation Extraction
        chunk_extractions = []
        chunk_relations = []
        total_chunks = len(chunks)

        for i, chunk in enumerate(chunks):
            # Check tracing mode
            should_trace = True
            if TRACE_INDEXING == "off":
                should_trace = False
            elif TRACE_INDEXING == "sample":
                should_trace = (i < 15)  # Trace first 15 chunks

            with tracing_context(enabled=should_trace):
                extraction = extract_from_chunk(chunk)

            chunk_extractions.append((chunk["id"], extraction.entities))
            chunk_relations.append((chunk["id"], extraction.relations))

            # Progress calculation for extraction (20% to 65%)
            progress = 20 + int((i + 1) / total_chunks * 45)
            index_tracker.update(
                stage=f"Extracting knowledge: chunk {i + 1}/{total_chunks}",
                percent=progress,
            )

        # Step 4: Normalise and merge duplicate entities
        index_tracker.update(stage="Normalizing & merging entities", percent=70)
        merged_entities, alias_map = merge_extracted_entities(chunk_extractions)

        total_relations_count = sum(len(rels) for _, rels in chunk_relations)
        index_tracker.update(
            stage="Building NetworkX knowledge graph",
            percent=75,
            counts={"entities": len(merged_entities), "relations": total_relations_count}
        )

        # Step 5: Build NetworkX Knowledge Graph
        G = build_knowledge_graph(merged_entities, chunk_relations, alias_map)

        # Step 6: Louvain Communities & Summarization
        index_tracker.update(stage="Detecting Louvain communities", percent=80)
        raw_communities = detect_communities(G, seed=42)

        # Assign community IDs to nodes
        for cid, node_set in enumerate(raw_communities):
            for node in node_set:
                if G.has_node(node):
                    G.nodes[node]["community"] = cid

        index_tracker.update(
            stage=f"Summarizing {len(raw_communities)} communities",
            percent=85,
            counts={"communities": len(raw_communities)}
        )

        # Summarize communities (sample or all)
        community_summaries: List[Dict[str, Any]] = []
        for cid, node_set in enumerate(raw_communities):
            nodes_list = list(node_set)
            # Trace all community summaries unless TRACE_INDEXING is off
            should_trace_comm = (TRACE_INDEXING != "off")
            with tracing_context(enabled=should_trace_comm):
                comm_rep = summarize_community(cid, nodes_list, G)
            community_summaries.append(comm_rep)

        # Step 7: Build FAISS Vector Indexes & Save everything
        index_tracker.update(stage="Building FAISS vector indexes", percent=92)
        store.save_all(G, chunks, merged_entities, community_summaries)

        index_tracker.update(
            state="done",
            stage="Indexing complete",
            percent=100,
            counts={
                "chunks": len(chunks),
                "entities": len(merged_entities),
                "relations": len(G.edges),
                "communities": len(raw_communities),
            }
        )
        logger.info("Indexing finished successfully.")

    except Exception as e:
        logger.exception("Error occurred during indexing: %s", e)
        index_tracker.update(state="error", stage="Failed", percent=0, error=str(e))

