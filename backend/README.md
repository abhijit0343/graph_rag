# 🖥️ Backend Service (`backend/`)

> **FastAPI Orchestration, Storage, & Algorithms Layer**  
> Coordinates the document ingestion pipeline, graph algorithms, vector indices, retrieval strategies, evaluation benchmarks, and REST API endpoints.

---

## 📂 Subsystem Overview

```
backend/
├── main.py             # FastAPI entrypoint, CORS configuration, startup health checks
├── config.py           # Pipeline hyperparameters, directory paths & graph traversal constants
├── tracing.py          # LangSmith telemetry, span logging & user feedback collection
├── api/                # REST API routers (Upload, Ingestion, Query, Graph, Evaluation)
│   └── README.md       # -> See api/README.md for route contracts and endpoints
├── pipeline/           # 7-stage Ingestion Engine (Load, Chunk, Extract, Merge, Graph, Cluster, Store)
│   └── README.md       # -> See pipeline/README.md for the ETL lifecycle
├── retrieval/          # Dual Graph-RAG Search Engine (Router, Local Search, Global Search, Baseline)
│   └── README.md       # -> See retrieval/README.md for retrieval mechanics
└── evaluation/         # Automated Benchmark Suite (LLM Judges, Evaluation Runner, Questions)
    └── README.md       # -> See evaluation/README.md for the benchmark framework
```

---

## 📄 File-by-File Technical Breakdown

### 1. [`main.py`](file:///d:/agentic%20ai/graph_rag/backend/main.py)
* **Purpose**: Application entrypoint and HTTP lifecycle manager.
* **Key Components**:
  * **CORS Middleware**: Explicitly configured for `http://localhost:5173` (Vite dev server) and production origins.
  * **Lifespan Context Manager**:
    * Probes Ollama connectivity (`http://localhost:11434`) on startup.
    * Verifies that `llama3.2:3b` and `nomic-embed-text` are pulled and accessible.
    * Ensures data directories (`data/uploads/`, `data/storage/`) exist.
  * **Router Mounting**:
    * `/api/index` $\rightarrow$ `routes_index.router`
    * `/api/query` $\rightarrow$ `routes_query.router`
    * `/api/graph` $\rightarrow$ `routes_graph.router`
    * `/api/eval`  $\rightarrow$ `routes_eval.router`
  * **Global Error Interceptor**: Normalizes unhandled server exceptions into clean JSON error objects for the frontend.

### 2. [`config.py`](file:///d:/agentic%20ai/graph_rag/backend/config.py)
* **Purpose**: Centralized operational configuration.
* **Key Settings**:
  * `DATA_DIR`: Root path for storage (`data/`).
  * `UPLOAD_DIR`: Target path for raw uploads (`data/uploads/`).
  * `STORAGE_DIR`: Target path for persisted indices and graphs (`data/storage/`).
  * `CHUNK_SIZE`: 600 characters.
  * `CHUNK_OVERLAP`: 100 characters.
  * `ENTITY_SIMILARITY_THRESHOLD`: 0.85 cosine cutoff for alias clustering.
  * `TOP_K_ENTITIES`: 5 seed entities for local search.
  * `MAX_HOPS`: 2-hop BFS expansion in local search.

### 3. [`tracing.py`](file:///d:/agentic%20ai/graph_rag/backend/tracing.py)
* **Purpose**: Observability and trace telemetry via LangSmith.
* **Key Features**:
  * Wraps LLM calls and retrieval stages with LangChain tracer callbacks when configured.
  * Captures input prompts, output completions, token latencies, and runtime errors.
  * **Graceful Degradation**: If `LANGCHAIN_API_KEY` is omitted or offline, the system catches network warnings silently without blocking local pipeline execution.

---

## 🚀 Running the Backend

From the project root directory:

```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

* **Interactive OpenAPI Swagger Docs**: [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs)
* **Alternative ReDoc**: [`http://127.0.0.1:8000/redoc`](http://127.0.0.1:8000/redoc)

