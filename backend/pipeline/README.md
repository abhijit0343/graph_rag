# ⚙️ Ingestion Pipeline (`backend/pipeline/`)

> **The 7-Stage Knowledge Graph ETL Engine**  
> Transforms unstructured raw documents (PDF, TXT) into a connected NetworkX knowledge graph, hierarchical Louvain community reports, and three vector-searchable FAISS indices.

---

## 🏗️ 7-Stage Pipeline Architecture

```
[Raw Documents in data/uploads/]
       │
       ▼  (1) loaders.py
[Clean Text Strings in Memory]
       │
       ▼  (2) chunking.py (600 chars, 100 overlap)
[Deterministic Text Chunks with Stable IDs]
       │
       ▼  (3) extract.py (Llama 3.2 3B few-shot extraction)
[Raw Entity & Relationship Tuples]
       │
       ▼  (4) entity_merge.py (nomic-embed-text Cosine Clustering)
[Canonical Merged Entities & Resolved Edges]
       │
       ▼  (5) graph_build.py (NetworkX Graph Construction)
[Directed Weighted Knowledge Graph]
       │
       ▼  (6) communities.py (Louvain Modularity + LLM Summaries)
[Hierarchical Community Thematic Reports]
       │
       ▼  (7) stores.py
[Persisted in data/storage/: graph.json, communities.json, & 3 FAISS Indices]
```

---

## 📄 File-by-File Technical Breakdown

### 1. [`loaders.py`](file:///d:/agentic%20ai/graph_rag/backend/pipeline/loaders.py)
* **Purpose**: In-memory document extraction and normalization.
* **Input**: File paths in `data/uploads/` (`.pdf`, `.txt`, `.md`).
* **Output**: `List[Dict[str, Any]]` containing `doc_id`, `filename`, and `text`.
* **Key Implementation Details**:
  * Extracts text from PDFs using `pypdf.PdfReader` with clean page-break markers.
  * Reads text files with **automatic encoding fallback** (`utf-8` with fallback to `latin-1`).
  * **Memory-only**: Does not create redundant temporary files on disk.

### 2. [`chunking.py`](file:///d:/agentic%20ai/graph_rag/backend/pipeline/chunking.py)
* **Purpose**: Deterministic sliding-window chunking.
* **Input**: Normalized document text strings.
* **Output**: `List[Dict[str, Any]]` with fields: `chunk_id`, `doc_id`, `text`, `start_char`, `end_char`.
* **Hyperparameters**:
  * `CHUNK_SIZE`: 600 characters (~100–120 tokens).
  * `CHUNK_OVERLAP`: 100 characters (~20 tokens) to preserve semantic continuity across boundaries.
  * `chunk_id`: Deterministic hash format `doc_<hash>_c<index>`.

### 3. [`extract.py`](file:///d:/agentic%20ai/graph_rag/backend/pipeline/extract.py)
* **Purpose**: Structured knowledge extraction via local LLM.
* **Input**: Text chunks.
* **Output**: `List[ExtractionResult]` (entities and relationships per chunk).
* **Key Implementation Details**:
  * Invokes `llama3.2:3b` with temperature `0.0` and JSON mode enabled.
  * Uses few-shot prompt injection (`EXTRACTION_SYSTEM` and `EXTRACTION_USER` from `models/prompts.py`).
  * Validates model outputs with Pydantic v2 `ExtractionResult`.
  * Integrated with `models/cache.py` to prevent redundant inference on identical chunks.

### 4. [`entity_merge.py`](file:///d:/agentic%20ai/graph_rag/backend/pipeline/entity_merge.py)
* **Purpose**: Cross-document entity deduplication and alias resolution.
* **Input**: Raw extracted entities and relations.
* **Output**: Canonical entities dictionary and re-mapped relationship edges.
* **Algorithm**:
  1. Generates 768-dimensional dense embeddings for all entity names using `nomic-embed-text`.
  2. Computes pairwise cosine similarity matrix: $\text{sim}(u, v) = \frac{u \cdot v}{\|u\| \|v\|}$.
  3. Clusters pairs exceeding `SIMILARITY_THRESHOLD = 0.85`.
  4. Resolves aliases (e.g., *"Tim Berners-Lee"* $\leftrightarrow$ *"Sir Tim Berners-Lee"* $\leftrightarrow$ *"Berners-Lee"*) into a single canonical representative name.
  5. Remaps all source and target references in edges to the canonical names.

### 5. [`graph_build.py`](file:///d:/agentic%20ai/graph_rag/backend/pipeline/graph_build.py)
* **Purpose**: NetworkX graph topology construction.
* **Input**: Canonical entities and re-mapped relationships.
* **Output**: In-memory `nx.DiGraph` (directed weighted graph).
* **Key Mechanics**:
  * Adds nodes with attributes: `type`, `description`, and `mention_count`.
  * Adds directed edges between related entities.
  * **Edge Weight Accumulation**: When multiple chunks describe the same relationship, the edge weight increments:
    $$\text{weight}(u, v) = \sum \text{co-occurrences}(u, v)$$
  * Calculates node degrees and network density metrics.

### 6. [`communities.py`](file:///d:/agentic%20ai/graph_rag/backend/pipeline/communities.py)
* **Purpose**: Hierarchical community detection and thematic reporting.
* **Input**: NetworkX graph.
* **Output**: `List[CommunityReport]` containing cluster summaries.
* **Workflow**:
  1. Creates an undirected view of the knowledge graph.
  2. Executes **Louvain Modularity Optimization** (`community_louvain.best_partition`) to partition nodes into dense sub-communities maximizing modularity score $Q$.
  3. For each detected community, serializes member nodes, edge connections, and descriptions into a context prompt.
  4. Calls `llama3.2:3b` with `COMMUNITY_REPORT_PROMPT` to synthesize an executive summary, key findings, and significance rating for each cluster.

### 7. [`indexer.py`](file:///d:/agentic%20ai/graph_rag/backend/pipeline/indexer.py)
* **Purpose**: Central state machine and orchestrator for the entire ingestion lifecycle.
* **Key Responsibilities**:
  * Runs the ingestion pipeline asynchronously in a background thread to prevent blocking FastAPI request loops.
  * Exposes thread-safe progress state tracking:
    ```json
    {
      "status": "indexing",
      "stage": "extract",
      "stage_index": 3,
      "total_stages": 7,
      "progress_pct": 42.8,
      "message": "Extracting entities from chunk 12/28..."
    }
    ```
  * Safely handles errors and writes logs on pipeline failures.

### 8. [`stores.py`](file:///d:/agentic%20ai/graph_rag/backend/pipeline/stores.py)
* **Purpose**: Disk persistence and vector index management.
* **Storage Directory**: `data/storage/`
* **Artifacts Persisted**:
  * `graph.json`: Complete NetworkX node-link structure (nodes, attributes, directed edges, weights).
  * `communities.json`: Serialized Louvain community reports and cluster memberships.
  * `chunks.json`: Full text chunks with document source IDs and character offsets.
  * `entities.json`: Canonical entity registry with descriptions and types.
  * `entities.faiss`: Binary FAISS `IndexFlatIP` for canonical entity names.
  * `relations.faiss`: Binary FAISS `IndexFlatIP` for relationship semantic search.
  * `chunks.faiss`: Binary FAISS `IndexFlatIP` for raw chunk text embeddings (baseline search).
* **Vector Mechanics**: All vectors are L2-normalized upon creation, turning Inner Product (`IndexFlatIP`) into exact **Cosine Similarity**.

