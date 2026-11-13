# 🔍 Retrieval Engine (`backend/retrieval/`)

> **The Dual Graph-RAG Retrieval & Synthesis Layer**  
> Routes incoming questions between localized graph neighborhood traversal and global corpus-wide community Map-Reduce synthesis, benchmarked against a naive vector baseline.

---

## 🧭 Retrieval Strategy Flowchart

```
                 ┌────────────────────────────────┐
                 │       Incoming User Query      │
                 └───────────────┬────────────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │   router.py (LLM)     │
                     └───────────┬───────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         │ (Entity-Specific / Multi-Hop)                 │ (Thematic / Corpus-Wide)
         ▼                                               ▼
┌─────────────────────────────┐             ┌─────────────────────────────┐
│       local_search.py       │             │       global_search.py      │
├─────────────────────────────┤             ├─────────────────────────────┤
│ 1. Seed Entities via FAISS  │             │ 1. Load Louvain Communities │
│ 2. 2-Hop BFS Graph Traversal│             │ 2. Map: Evaluate Summaries  │
│ 3. Chunk Provenance Lookup  │             │ 3. Reduce: Synthesize Report│
│ 4. Grounded Synthesis (<5s) │             │ 4. Executive Sensemaking    │
└──────────────┬──────────────┘             └──────────────┬──────────────┘
               │                                           │
               └─────────────────┬─────────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │   Unified JSON Answer   │
                    │   + Graph Subtopology   │
                    │   + Source Citations    │
                    └─────────────────────────┘
```

---

## 📄 File-by-File Technical Breakdown

### 1. [`router.py`](file:///d:/agentic%20ai/graph_rag/backend/retrieval/router.py)
* **Purpose**: Semantic query classification.
* **Mechanism**:
  * Evaluates user intent via `llama3.2:3b` with temperature `0.0`.
  * Outputs strict Pydantic model `RouteSelection`:
    * `"local"`: Targeted queries regarding specific people, technologies, events, or connections (e.g. *"Who created the World Wide Web?"*, *"What is the connection between Python and C?"*).
    * `"global"`: High-level sensemaking, summarizing the entire knowledge base, or identifying overarching themes (e.g. *"What are the main research areas in this archive?"*, *"Summarize the core themes"*).
  * Includes programmatic heuristics for quick fallback on direct keyword queries.

### 2. [`local_search.py`](file:///d:/agentic%20ai/graph_rag/backend/retrieval/local_search.py)
* **Purpose**: High-precision entity-centric graph search.
* **Execution Steps**:
  1. **Seed Retrieval**: Vectorizes query with `nomic-embed-text` and queries `entities.faiss` to find top-$k$ (default 5) closest entity seeds.
  2. **Neighborhood Expansion**: Traverses the NetworkX knowledge graph using breadth-first search up to **2 hops** from each seed:
     $$\mathcal{N}_2(v) = \{u \in V \mid d(v, u) \le 2\}$$
  3. **Relational Path Extraction**: Collects connecting edges, weights, and descriptions between active entities.
  4. **Source Chunk Grounding**: Resolves chunk IDs associated with the active subgraph nodes and retrieves exact text passages from `chunks.json`.
  5. **Grounded Synthesis**: Formulates context into `LOCAL_ANSWER_SYSTEM` prompt. Synthesizes an answer strictly grounded in the extracted sub-graph, returning:
     * `answer`: Synthesized text response.
     * `entities`: Matched seed and neighbor node objects.
     * `relations`: Active sub-graph edge tuples.
     * `sources`: Exact chunk text citations.
     * `latency`: Execution time in seconds.

### 3. [`global_search.py`](file:///d:/agentic%20ai/graph_rag/backend/retrieval/global_search.py)
* **Purpose**: High-level thematic sensemaking across the entire document corpus.
* **Architecture**: **Hierarchical Map-Reduce** over pre-computed community reports:
  1. **Map Phase**:
     * Loads community reports from `communities.json`.
     * For each community report, prompts the LLM (`MAP_SYSTEM`) to evaluate the report against the user query, outputting key thematic bullet points and a relevance rating (0–10).
  2. **Filtering & Ranking**: Sorts intermediate map outputs, discarding communities with relevance scores below threshold.
  3. **Reduce Phase**:
     * Aggregates the highest-scoring intermediate community insights into a consolidated context.
     * Prompts the LLM (`REDUCE_SYSTEM`) to synthesize a structured executive answer with overarching themes, patterns, and citations to specific community IDs.
* **Benefit**: Answers macro-level questions without having to fit every raw chunk into the model's 4096-token context window.

### 4. [`baseline.py`](file:///d:/agentic%20ai/graph_rag/backend/retrieval/baseline.py)
* **Purpose**: Traditional Naive Vector RAG baseline implementation.
* **Mechanism**:
  1. Embeds query directly with `nomic-embed-text`.
  2. Executes vector search against `chunks.faiss` to pull top-$k$ text chunks.
  3. Injects raw chunks into a standard RAG prompt without graph topology or community reports.
  4. Generates response via `llama3.2:3b`.
* **Usage**: Serves as the experimental control group in `backend/evaluation/` to benchmark the performance gains of GraphRAG over standard Vector RAG.

