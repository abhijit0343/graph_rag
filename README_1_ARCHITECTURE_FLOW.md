# 🗺️ Master Documentation & System Flow Guide (`README_1_ARCHITECTURE_FLOW.md`)

> **The New Developer's Roadmap to the Entire Local GraphRAG Codebase**  
> If you are a new developer or researcher exploring this project, this document provides the overarching map connecting all subsystem documentation files into a unified learning path.

---

## 🧭 The Documentation Graph

The project's documentation is divided into specialized, modular README files corresponding to each architectural layer. Follow the recommended **7-step reading sequence** below to build an intuitive mental model of the system:

```
                                  ┌───────────────────────────────┐
                                  │   README_1_ARCHITECTURE_FLOW  │
                                  │       (You Are Here)          │
                                  └──────────────┬────────────────┘
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   ▼                             ▼                             ▼
        ┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
        │  1. models/README   │       │ 2. backend/pipeline │       │ 3. backend/retrieval│
        │  Cognitive Layer    │       │ 7-Stage ETL Engine  │       │ Dual Search Engine  │
        └──────────┬──────────┘       └──────────┬──────────┘       └──────────┬──────────┘
                   │                             │                             │
                   └─────────────────────────────┼─────────────────────────────┘
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   ▼                             ▼                             ▼
        ┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
        │ 4. backend/api      │       │ 5. backend/eval     │       │  6. backend/README  │
        │ REST API Endpoints  │       │ Benchmark & Judges  │       │ Server Orchestration│
        └──────────┬──────────┘       └──────────┬──────────┘       └──────────┬──────────┘
                   │                             │                             │
                   └─────────────────────────────┼─────────────────────────────┘
                                                 │
                                                 ▼
                                      ┌─────────────────────┐
                                      │ 7. frontend/README  │
                                      │ React & Physics UI  │
                                      └─────────────────────┘
```

---

## 📚 7-Step Recommended Reading Order

### Step 1: Start with the AI Foundation
* 📖 **Read**: [`models/README.md`](file:///d:/agentic%20ai/graph_rag/models/README.md)
* **What you will learn**:
  * How the pure cognitive layer is decoupled from backend and frontend.
  * How `schemas.py` establishes strict Pydantic v2 JSON contracts for entities, relations, and routes.
  * How `prompts.py` engineers few-shot prompts optimized for local 3B models (`llama3.2:3b`).
  * How `cache.py` uses SHA-256 prompt hashing to ensure instant re-runs and zero wasted inference.

### Step 2: Understand Knowledge Ingestion (Data In)
* 📖 **Read**: [`backend/pipeline/README.md`](file:///d:/agentic%20ai/graph_rag/backend/pipeline/README.md)
* **What you will learn**:
  * How documents transition from memory strings (`loaders.py`) to chunks (`chunking.py`).
  * How Llama 3.2 3B extracts entities in JSON mode (`extract.py`).
  * How cosine clustering merges entity aliases (`entity_merge.py`).
  * How NetworkX builds weighted directed graphs (`graph_build.py`).
  * How Louvain modularity clusters nodes into hierarchical communities (`communities.py`).
  * How `stores.py` serializes everything to disk and creates 3 binary FAISS vector indices.

### Step 3: Understand Information Retrieval (Data Out)
* 📖 **Read**: [`backend/retrieval/README.md`](file:///d:/agentic%20ai/graph_rag/backend/retrieval/README.md)
* **What you will learn**:
  * How `router.py` classifies queries into local entity lookups or global themes.
  * How `local_search.py` performs 2-hop BFS graph traversal around FAISS seed entities in `<5s`.
  * How `global_search.py` executes hierarchical Map-Reduce sweeps across Louvain community reports.
  * How `baseline.py` runs standard vector search as a control baseline.

### Step 4: Explore the REST API Surface
* 📖 **Read**: [`backend/api/README.md`](file:///d:/agentic%20ai/graph_rag/backend/api/README.md)
* **What you will learn**:
  * The HTTP contracts for document upload and ingestion triggers (`routes_index.py`).
  * The query execution and feedback logging contracts (`routes_query.py`).
  * The graph topology and community streaming contracts (`routes_graph.py`).
  * The benchmark execution contracts (`routes_eval.py`).

### Step 5: Review the Scientific Benchmark Harness
* 📖 **Read**: [`backend/evaluation/README.md`](file:///d:/agentic%20ai/graph_rag/backend/evaluation/README.md)
* **What you will learn**:
  * How the 10-question golden dataset (`eval_questions.json`) tests different reasoning modes.
  * How `evaluators.py` uses dual LLM judges to independently score **Groundedness** and **Correctness**.
  * How `evaluate.py` calculates empirical performance deltas between GraphRAG and Naive RAG.

### Step 6: Review Backend Server Orchestration
* 📖 **Read**: [`backend/README.md`](file:///d:/agentic%20ai/graph_rag/backend/README.md)
* **What you will learn**:
  * How `main.py` handles CORS, error normalization, and lifespan Ollama health checks.
  * How `config.py` centrally sets traversal hops, chunk sizes, and similarity thresholds.
  * How `tracing.py` provides optional LangSmith telemetry with graceful offline fallbacks.

### Step 7: Experience the Editorial Motion Frontend
* 📖 **Read**: [`frontend/README.md`](file:///d:/agentic%20ai/graph_rag/frontend/README.md)
* **What you will learn**:
  * Why off-the-shelf animation libraries (GSAP, Framer Motion) were replaced with a custom **1ms substepped second-order spring solver** ($F = -kx - cv$).
  * How `HeroScene.jsx` renders interactive Three.js GLSL topographic shaders and 360-node particle graphs.
  * How `contourCanvas.jsx` computes 2D Marching Squares isocontours in real time.
  * How the pages (`Home`, `UploadIndex`, `Ask`, `GraphExplorer`, `Evaluation`) bind to backend APIs.

---

## ⚡ End-to-End System Life Cycle (The Big Picture)

```
1. USER UPLOADS DOCUMENT (Frontend /index)
   │
   ▼ POST /api/index/upload
2. BACKEND INGESTION PIPELINE (backend/pipeline/)
   ├── (loaders.py) In-memory text extraction (PDF/TXT)
   ├── (chunking.py) 600-char sliding windows
   ├── (extract.py) Llama 3.2 3B JSON entity extraction
   ├── (entity_merge.py) Cosine deduplication & alias resolution
   ├── (graph_build.py) NetworkX directed graph synthesis
   ├── (communities.py) Louvain modularity clustering + LLM summaries
   └── (stores.py) Writes graph.json, communities.json & 3x FAISS indices
   │
   ▼ Ingestion Complete (data/storage/)
3. USER ASKS A QUESTION (Frontend /ask)
   │
   ▼ POST /api/query
4. BACKEND RETRIEVAL ENGINE (backend/retrieval/)
   ├── (router.py) Semantic Classifier -> chooses Local or Global
   │
   ├── IF LOCAL: (local_search.py)
   │     1. FAISS finds seed entities
   │     2. NetworkX 2-hop BFS extracts active neighborhood
   │     3. Chunks retrieved from chunks.json
   │     4. Llama 3.2 3B synthesizes grounded answer (< 5s)
   │
   └── IF GLOBAL: (global_search.py)
         1. Loads pre-computed Louvain community reports
         2. Map phase: scores each community's relevance
         3. Reduce phase: synthesizes macro-thematic response
   │
   ▼ JSON Response (Answer, Entities, Graph Links, Source Chunks)
5. FRONTEND VISUALIZATION (Frontend /ask & /graph)
   ├── Synthesized answer rendered with Cormorant Garamond typography
   ├── Interactive 2D Force Graph visualizes active reasoning path
   └── Source cards display exact document citations with chunk provenance
```

---

## 🚀 Quick Navigation Links

| Subsystem | Documentation File | Direct Link |
| :--- | :--- | :--- |
| **Complete System Architecture** | `README.md` | [Root README](file:///d:/agentic%20ai/graph_rag/README.md) |
| **Cognitive & Model Layer** | `models/README.md` | [Models Guide](file:///d:/agentic%20ai/graph_rag/models/README.md) |
| **Backend Core** | `backend/README.md` | [Backend Guide](file:///d:/agentic%20ai/graph_rag/backend/README.md) |
| **7-Stage Ingestion Pipeline** | `backend/pipeline/README.md` | [Pipeline Guide](file:///d:/agentic%20ai/graph_rag/backend/pipeline/README.md) |
| **Dual Retrieval Engine** | `backend/retrieval/README.md` | [Retrieval Guide](file:///d:/agentic%20ai/graph_rag/backend/retrieval/README.md) |
| **REST API Specification** | `backend/api/README.md` | [API Guide](file:///d:/agentic%20ai/graph_rag/backend/api/README.md) |
| **Evaluation Benchmark** | `backend/evaluation/README.md` | [Evaluation Guide](file:///d:/agentic%20ai/graph_rag/backend/evaluation/README.md) |
| **Motion & Editorial Frontend** | `frontend/README.md` | [Frontend Guide](file:///d:/agentic%20ai/graph_rag/frontend/README.md) |

