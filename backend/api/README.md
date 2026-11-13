# 🌐 REST API Endpoints (`backend/api/`)

> **The HTTP Interface & Routing Layer**  
> Exposes FastAPI endpoints connecting the React frontend to the ingestion engine, dual retrieval pipelines, graph topology explorer, and benchmark evaluation suite.

---

## 🛣️ API Route Registry

| Path | Methods | Module | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/index/*` | `POST`, `GET`, `DELETE` | [`routes_index.py`](file:///d:/agentic%20ai/graph_rag/backend/api/routes_index.py) | Document upload, async ingestion triggers, progress polling |
| `/api/query/*` | `POST` | [`routes_query.py`](file:///d:/agentic%20ai/graph_rag/backend/api/routes_query.py) | Question-answering with strategy selection & feedback |
| `/api/graph/*` | `GET` | [`routes_graph.py`](file:///d:/agentic%20ai/graph_rag/backend/api/routes_graph.py) | Graph topology streaming, telemetry metrics, community reports |
| `/api/eval/*` | `POST`, `GET` | [`routes_eval.py`](file:///d:/agentic%20ai/graph_rag/backend/api/routes_eval.py) | Benchmark execution and comparative evaluation metrics |

---

## 📄 File-by-File Technical Breakdown

### 1. [`routes_index.py`](file:///d:/agentic%20ai/graph_rag/backend/api/routes_index.py)
* **Purpose**: Manages document uploads and controls the 7-stage ingestion lifecycle.
* **Endpoints**:
  * `POST /api/index/upload`: Receives multipart file uploads (`multipart/form-data`) supporting `.pdf`, `.txt`, and `.md`. Stores files safely in `data/uploads/`.
  * `POST /api/index/start`: Launches `indexer.py` on a separate background thread. Returns immediately with `202 Accepted` to prevent client HTTP timeouts.
  * `GET /api/index/status`: Polled by frontend at 1-second intervals. Returns live progress:
    ```json
    {
      "status": "indexing",
      "stage": "extract",
      "progress_pct": 42.8,
      "message": "Extracting entities from chunk 12/28...",
      "counts": { "documents": 2, "chunks": 28, "entities": 64, "communities": 6 }
    }
    ```
  * `DELETE /api/index/clear`: Safely flushes `data/uploads/` and wipes `data/storage/` indices to allow fresh ingestion runs.

### 2. [`routes_query.py`](file:///d:/agentic%20ai/graph_rag/backend/api/routes_query.py)
* **Purpose**: Primary question-answering gateway with automatic or manual strategy selection.
* **Endpoints**:
  * `POST /api/query`:
    * **Request Body**:
      ```json
      {
        "query": "Who invented the World Wide Web and what did he work on at CERN?",
        "strategy": "auto"
      }
      ```
      *Strategies*: `"auto"` (LLM router decides), `"local"`, `"global"`, or `"baseline"`.
    * **Response Contract**:
      ```json
      {
        "answer": "Tim Berners-Lee invented the World Wide Web while working at CERN...",
        "strategy_used": "local",
        "route_reasoning": "Query asks about a specific person and relationship to an organization.",
        "entities": [
          { "id": "Tim Berners-Lee", "type": "PERSON", "description": "English computer scientist" },
          { "id": "CERN", "type": "ORGANIZATION", "description": "European research organization" }
        ],
        "relations": [
          { "source": "Tim Berners-Lee", "target": "CERN", "relationship": "EMPLOYED_AT", "weight": 3.0 }
        ],
        "sources": [
          { "chunk_id": "doc_a1b2_c0", "text": "...in 1989 Tim Berners-Lee submitted...", "doc_id": "history.txt" }
        ],
        "latency": 3.42,
        "trace_id": "langsmith_trace_98765"
      }
      ```
  * `POST /api/query/feedback`: Submits thumbs-up/down ratings and user comments linked to the `trace_id` for quality tracking in LangSmith.

### 3. [`routes_graph.py`](file:///d:/agentic%20ai/graph_rag/backend/api/routes_graph.py)
* **Purpose**: Feeds graph visualization engines (Three.js and 2D canvas force graphs).
* **Endpoints**:
  * `GET /api/graph/topology`: Returns the complete node-link representation:
    ```json
    {
      "nodes": [
        { "id": "Tim Berners-Lee", "type": "PERSON", "community": 1, "degree": 8 }
      ],
      "links": [
        { "source": "Tim Berners-Lee", "target": "CERN", "label": "EMPLOYED_AT", "weight": 3.0 }
      ]
    }
    ```
  * `GET /api/graph/stats`: Telemetry figures (node count, edge count, graph density, average degree, and total Louvain communities).
  * `GET /api/graph/communities`: Lists all detected community reports with their member entities and synthesized executive summaries.
  * `GET /api/graph/node/{node_id}`: Returns detailed metadata for a single node and its immediate 1-hop and 2-hop ego network.

### 4. [`routes_eval.py`](file:///d:/agentic%20ai/graph_rag/backend/api/routes_eval.py)
* **Purpose**: Coordinates the execution and telemetry of the evaluation benchmark.
* **Endpoints**:
  * `POST /api/eval/run`: Triggers background evaluation comparing GraphRAG vs. Naive Baseline on the 10-question evaluation dataset.
  * `GET /api/eval/status`: Returns current benchmark completion percentage and evaluated questions.
  * `GET /api/eval/results`: Returns side-by-side comparative metrics (Groundedness score, Correctness score, Latency, and LLM judge rationale).

