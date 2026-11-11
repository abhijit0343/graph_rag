# Local GraphRAG — Editorial Intelligence System

> **A privacy-first, local Knowledge Graph Augmented Generation (GraphRAG) platform with an editorial, motion-led design system.**  
> Built with **FastAPI**, **React 18 + Vite**, **NetworkX**, **FAISS**, and **100% local AI inference** via **Ollama** (`llama3.2:3b` + `nomic-embed-text`). Features optional tracing and evaluation with **LangSmith**.

---

## 1. System Architecture

The architecture enforces strict one-way dependency isolation:
$$\text{Frontend (React + Vite)} \xrightarrow{\text{HTTP / JSON}} \text{Backend (FastAPI)} \xrightarrow{\text{Python}} \text{Models (Ollama + FAISS)}$$

```
graph_rag/
├── .env.example              # Environment variables template (Ollama & LangSmith)
├── .gitignore                # Production ignore rules (prevents committing secrets/cache)
├── requirements.txt          # Python dependencies
├── README.md                 # Complete system documentation
├── models/                   # Pure AI layer (Zero backend/frontend dependencies)
│   ├── config.py             # Model names, Ollama base URL, temperatures, context window (4096)
│   ├── llm.py                # ChatOllama & OllamaEmbeddings factory with health checking
│   ├── prompts.py            # Few-shot prompts: extraction, community summary, router, map, reduce, answers, judges
│   ├── schemas.py            # Pydantic models: Entity, Relation, Extraction, Route, MapAnswer, JudgeScore
│   └── cache.py              # SHA-256 disk cache for rapid reproducible LLM responses
├── backend/                  # Orchestration, graph pipeline, and API server
│   ├── main.py               # FastAPI application entrypoint with CORS & logging
│   ├── config.py             # Pipeline paths, chunk size (600/100), top-k, hops
│   ├── tracing.py            # LangSmith tracing decorators and user feedback handlers
│   ├── api/                  # REST API routes
│   │   ├── routes_index.py   # Document upload (multipart) & async indexing status
│   │   ├── routes_query.py   # Query routing (auto, local, global) and feedback
│   │   ├── routes_graph.py   # Subgraph topology and community filtering
│   │   └── routes_eval.py    # Benchmark execution and evaluation metrics
│   ├── pipeline/             # 7-stage Ingestion Pipeline
│   │   ├── loaders.py        # PDF and TXT file loaders with UTF-8/Latin-1 fallback
│   │   ├── chunking.py       # Sliding-window character/token chunking (600/100)
│   │   ├── extract.py        # Structured JSON entity & relationship extraction via Llama 3.2 3B
│   │   ├── entity_merge.py   # Cross-document cosine deduplication and alias resolution
│   │   ├── graph_build.py    # NetworkX directed graph topology builder with edge weight accumulation
│   │   ├── communities.py    # Louvain hierarchical community detection & summarization
│   │   ├── indexer.py        # Pipeline orchestrator with thread-safe progress state tracking
│   │   └── stores.py         # Persistent FAISS indices & JSON storage manager
│   ├── retrieval/            # Query & Retrieval Engines
│   │   ├── router.py         # Semantic strategy classifier (Local vs. Global)
│   │   ├── local_search.py   # Entity matching + graph neighborhood expansion + grounded synthesis
│   │   ├── global_search.py  # Community-level map-reduce thematic synthesis
│   │   └── baseline.py       # Standard naive vector search baseline
│   └── evaluation/           # Benchmark suite
│       ├── evaluate.py       # Benchmark pipeline coordinator
│       ├── evaluators.py     # Groundedness and correctness LLM judges
│       └── eval_questions.json# 10 pre-configured benchmark questions
└── frontend/                 # Motion-led editorial React web application
    ├── index.html            # HTML entrypoint
    ├── vite.config.js        # Vite bundler configuration
    ├── package.json          # UI dependencies (@fontsource, three, lenis, lucide-react)
    └── src/
        ├── main.jsx          # React DOM root
        ├── App.jsx           # App layout and route switcher (/ -> Home, /index -> Ingestion, /ask, /graph, /eval)
        ├── api/client.js     # Axios API client with infinite timeout on LLM routes
        ├── engine/           # Hand-written physics and motion engine
        │   ├── readToken.js  # Dynamic CSS token extractor for WebGL and 2D canvas
        │   ├── ticker.js     # Reference-counted rAF tick loop integrated with Lenis
        │   ├── spring.js     # 1ms substepped physical mass-spring-damper solver (F = -kx - cv)
        │   ├── textReveal.jsx# Physics-based inline word/letter reveal without descender clipping
        │   ├── scrollTrigger.js # Geometric scroll triggers with IntersectionObserver gating
        │   ├── useStickyStack.js# Sticky stack recede scale (0.9) and dark shading (0.55)
        │   ├── chequeredDissolve.jsx # Seam canvas dissolve with integer pseudorandom noise
        │   └── contourCanvas.jsx # 2D marching squares topographic contour canvas (CELLS=96)
        ├── components/       # Custom editorial UI components
        │   ├── Navbar.jsx    # Floating theme-aware navigation header
        │   ├── Cursor.jsx    # Signature 10px round ball cursor with soft ring hover
        │   ├── LoadingVeil.jsx# Node-link glyph sheet with 3-beat physical spring exit
        │   ├── GraphView.jsx # 2D interactive force graph visualization
        │   ├── SourceCard.jsx# Editorial document evidence cards
        │   ├── MagneticButton.jsx # Magnetic physics button snapping
        │   ├── ErrorBanner.jsx# Dismissible notification banners
        │   └── Spinner.jsx   # Minimalist typography loading indicators
        ├── pages/            # Application views
        │   ├── home/         # Art-directed 5-block motion-led Home page (/)
        │   │   ├── Home.jsx         # Sticky stack coordinator
        │   │   ├── HeroBlock.jsx    # Block 1: WebGL scene, headline, bracket telemetry
        │   │   ├── HeroScene.jsx    # Three.js GLSL topographic shader & 360-node graph
        │   │   ├── CircuitBlock.jsx # Block 2: Halftone canvas & Catmull-Rom circuit lap
        │   │   ├── TimelineBlock.jsx# Block 3: Central rail & 7-stage plate timeline
        │   │   ├── QueryBlock.jsx   # Block 4: Force graph figure & 5-card query strip
        │   │   └── SignoffBlock.jsx # Block 5: Wireframe node-link canvas & footer
        │   ├── UploadIndex.jsx      # Route /index: Ingestion engine & drop zone
        │   ├── Ask.jsx              # Route /ask: Question-answering interface
        │   ├── GraphExplorer.jsx    # Route /graph: Fullscreen interactive graph visualizer
        │   └── Evaluation.jsx       # Route /eval: Benchmark test runner and metrics
        └── styles/           # CSS design system (tokens, reset, typography)
            ├── tokens.css    # Colors, fonts, transitions, and dark forest overrides
            ├── base.css      # Grid, ambient glow, paper grain, and container styling
            ├── components.css# Editorial buttons, input underlines, and cards
            └── cursor.css    # Custom ball cursor and hover states
```

---

## 2. End-to-End System Workflow: From Loaders to Retrieval

Here is the exact lifecycle of how raw documents are ingested into structured knowledge, and how queries retrieve and synthesize grounded answers:

```
========================================================================================
PART A: THE 7-STAGE INGESTION PIPELINE (From Raw Files to Graph & FAISS Persistence)
========================================================================================

  [ Raw Files in data/uploads/ (.pdf, .txt, .md) ]
                        │
                        ▼ (1) backend/pipeline/loaders.py
  [ Clean Text Strings in RAM ]
                        │
                        ▼ (2) backend/pipeline/chunking.py (600 chars, 100 overlap)
  [ Text Chunks in RAM with deterministic IDs: doc.txt_c0000 ]
                        │
                        ▼ (3) backend/pipeline/extract.py (Llama 3.2 3B in JSON Mode)
  [ Extracted Entities & Relationships (Validated Pydantic Schemas in RAM) ]
                        │
                        ▼ (4) backend/pipeline/entity_merge.py (nomic-embed-text)
  [ Canonical Deduplicated Entities + alias_map in RAM (Cosine Similarity ≥ 0.90) ]
                        │
                        ▼ (5) backend/pipeline/graph_build.py (NetworkX Graph Engine)
  [ Undirected Weighted networkx.Graph in RAM (Cumulative Edge Weights) ]
                        │
                        ▼ (6) backend/pipeline/communities.py (Louvain Modularity + LLM)
  [ Hierarchical Community Clusters + Llama 3.2 3B Community Summary Reports in RAM ]
                        │
                        ▼ (7) backend/pipeline/stores.py (Disk Persistence & FAISS)
  [ Permanent Disk Storage in data/storage/ ]
  ├── graph.json (Serialized NetworkX topology)
  ├── chunks.json, entities.json, communities.json
  └── faiss/ (3 L2-normalized IndexFlatIP cosine vector indices)

========================================================================================
PART B: THE DUAL RETRIEVAL & SYNTHESIS ENGINE (From User Query to Grounded Answer)
========================================================================================

                             [ USER QUERY on /ask ]
                                        │
                                        ▼
                     [ POST /api/query (routes_query.py) ]
                     • Checks Ollama health (check_ollama_health)
                     • Verifies index presence (store.has_index)
                                        │
                                        ├──────────────────────────┐
                                        ▼                          ▼
                                 [ Mode: "local" ]         [ Mode: "global" ]
                                        ▲                          ▲
                                        │                          │
                               [ Mode: "auto" ]                    │
                                        │                          │
                                        ▼                          │
                        [ router.py (Llama 3.2 3B) ] ──────────────┘
                        Semantic classification: "local" or "global"
                                        │
               ┌────────────────────────┴────────────────────────┐
               ▼                                                 ▼
    [ LOCAL GRAPH SEARCH ]                            [ GLOBAL GRAPH SEARCH ]
    (local_search.py)                                 (global_search.py)
    1. Embed query with nomic-embed-text               1. Embed query with nomic-embed-text
    2. Search entities.index (FAISS) -> Top-5 seeds    2. Search communities.index -> Top-6 reports
    3. BFS Graph Walk (2 hops in NetworkX)             3. MAP PHASE (Llama 3.2 3B JSON):
    4. Collect induced subgraph & chunk IDs               • Score each community report (1 to 100)
    5. Retrieve text passages from chunks.json            • Discard irrelevant clusters (< 25)
    6. Synthesize grounded answer via Llama 3.2 3B     4. REDUCE PHASE (Llama 3.2 3B Synthesis):
       (Strict: "Information not found" if outside)        • Synthesize top findings into executive summary
               │                                                 │
               └────────────────────────┬────────────────────────┘
                                        ▼
                   [ JSON Response Returned to Frontend ]
                   • answer: Formatted editorial narrative
                   • mode_used: Strategy executed ("local" or "global")
                   • sources: Extracted entities, relation paths, and source chunk passages
                   • subgraph: Nodes and edges for interactive 2D GraphView visualizer
                   • latency_ms: Execution time in milliseconds
                   • trace_url: LangSmith trace URL (if enabled)
```

---

### 2.1 The Ingestion Pipeline in Detail

#### Stage 1: Document Ingestion (`backend/pipeline/loaders.py`)
- Reads documents directly from `data/uploads/` into system memory (RAM) as a list of Python dictionaries.
- **Text & Markdown Files**: Opened via UTF-8 with automatic fallback to `latin-1` to prevent Windows character decoding crashes.
- **PDF Files**: Extracted page-by-page using `pypdf.PdfReader`, stripping blank pages and joining text with `"\n\n"`.
- *Note*: `loaders.py` never writes to disk; it passes clean string dictionaries directly in memory to the chunker.

#### Stage 2: Sliding-Window Chunking (`backend/pipeline/chunking.py`)
- Chunks text using LangChain's `RecursiveCharacterTextSplitter`:
  - `chunk_size = 600` characters (ideal semantic density for local 3B model extraction).
  - `chunk_overlap = 100` characters (prevents entity names and relationships from being fractured across chunk boundaries).
- Assigns stable, deterministic chunk IDs: `filename.txt_c0000`, `filename.txt_c0001`. Every node and edge in the graph references these IDs to cite source passages.

#### Stage 3: LLM Entity & Relation Extraction (`backend/pipeline/extract.py`)
- For each text chunk, `llama3.2:3b` is invoked using `ChatOllama` with context-free grammar sampling (`format="json"`).
- Uses a few-shot prompt (`EXTRACTION_SYSTEM` in `models/prompts.py`) demonstrating exact extraction schemas.
- Cleans markdown fences (`_clean_json_output`) and validates the JSON output into strongly typed Pydantic models: `Extraction`, `Entity`, and `Relation`.
- **SHA-256 Disk Cache (`models/cache.py`)**: Checks `.cache/` before invoking the GPU. If the chunk was previously processed, the result loads in 0.001 seconds without re-running Ollama.

#### Stage 4: Cross-Document Entity Merging (`backend/pipeline/entity_merge.py`)
To prevent duplicate disconnected nodes (e.g. *"Tim Berners-Lee"* vs *"Berners-Lee"*):
1. **Lexical Normalization**: Strips punctuation and lowercases names (`_normalize_name`).
2. **Vector Cosine Clustering**: Candidate names are embedded into 768-dimensional vectors using `nomic-embed-text`. Pairwise cosine similarity is evaluated:
   - Pairs with $\text{sim} \ge 0.90$ (or $\ge 0.82$ for substring containment) are merged.
   - The most frequent, longest capitalized name becomes the canonical node.
   - Descriptions and chunk IDs are merged, and an `alias_map` dictionary is constructed.

#### Stage 5: Knowledge Graph Construction (`backend/pipeline/graph_build.py`)
- Compiles an undirected weighted graph using **NetworkX** (`networkx.Graph`).
- **Nodes**: Canonical entities with attributes `type`, `description`, `chunk_ids`, and `community`.
- **Edges**: Relationships between entities. If an edge already exists, its `weight` increments and descriptions are concatenated.

#### Stage 6: Louvain Community Detection & Summarization (`backend/pipeline/communities.py`)
- Executes `networkx.community.louvain_communities(G, seed=42)` to mathematically partition the graph into tightly clustered modules by maximizing modularity $Q$.
- Each community cluster is passed to `llama3.2:3b` with `COMMUNITY_SUMMARY_USER_TEMPLATE` to produce a 3–6 word title and a 4–6 sentence editorial summary report.

#### Stage 7: Disk Persistence & 3-Tier FAISS Indexing (`backend/pipeline/stores.py`)
Everything is saved to [data/storage/](file:///d:/agentic%20ai/graph_rag/data/storage):
- `graph.json`: Serialized nodes and edges (read by the `/graph` visualizer).
- `chunks.json`, `entities.json`, `communities.json`.
- `data/storage/faiss/`: Three independent L2-normalized Inner Product (`IndexFlatIP`) FAISS vector indices (`chunks.index`, `entities.index`, `communities.index`). Because vectors are unit-normalized ($\|\mathbf{v}\| = 1.0$), inner product equals **exact cosine similarity**.

#### Stage 8: Indexing Orchestrator (`backend/pipeline/indexer.py`)
- Orchestrates Stages 1 through 7 in a background daemon thread.
- Thread-safely updates `IndexStatusTracker` (`percent: 0% -> 100%`, stage names, and entity counts), feeding live polling data to `GET /api/index/status`.

---

### 2.2 The Retrieval Engine in Detail

When a question is submitted to `POST /api/query`:

#### Pre-Flight System Checks:
1. `check_ollama_health()`: Ensures Ollama is running and both models (`llama3.2:3b`, `nomic-embed-text`) are active.
2. `store.has_index()`: Verifies that pre-built graph and chunk files exist on disk before querying.

#### 1. Semantic Router (`backend/retrieval/router.py`)
When `mode="auto"`, `route_query()` asks `llama3.2:3b` to classify query intent:
- **Local Search**: For specific entities, facts, dates, or direct relations (*"Who invented X?"*, *"Where is Y located?"*).
- **Global Search**: For thematic, comparative, or corpus-wide summaries (*"What are the main themes?"*, *"Summarize all achievements across the dataset"*).
- Includes a keyword fallback heuristic if the LLM call fails.

#### 2. Local Search Pipeline (`backend/retrieval/local_search.py`)
Designed for precision and fast responses (**5–8 seconds**):
1. **Seed Entity Retrieval**: Queries `entities.index` in FAISS to find the top-5 most semantically relevant entities.
2. **Breadth-First Neighborhood Expansion**: Expands 1 to 2 hops across the NetworkX graph `G` to gather the induced subgraph and relationship paths.
3. **Chunk Context Assembly**: Looks up original source passages in `chunks.json` corresponding to the visited nodes and edges (with direct FAISS chunk search as fallback).
4. **Grounded Answer Synthesis**: Injects entities, relation paths, and source passages into `LOCAL_ANSWER_USER_TEMPLATE`.
   - **Anti-Hallucination**: If the answer is unmentioned in the text, it strictly states: *"Information not found in the indexed documents."*

#### 3. Global Search Pipeline (`backend/retrieval/global_search.py`)
Designed for broad, macro-level questions (**30–45 seconds** on local GPU):
1. **Candidate Community Selection**: Queries `communities.index` in FAISS to select the top-6 most relevant community reports.
2. **Map Phase (`map_community_answer`)**: In parallel/serial, `llama3.2:3b` evaluates each community report, returning a relevance score (1–100) and partial answer JSON.
3. **Filter**: Clusters scoring under 25 or marked `"IRRELEVANT"` are discarded.
4. **Reduce Phase (`reduce_answers`)**: The highest-ranked community findings are synthesized by `llama3.2:3b` into an authoritative executive summary.

#### 4. Naive Vector Baseline (`backend/retrieval/baseline.py`)
- Standard vector RAG baseline that retrieves top-$k$ raw text chunks from `chunks.index` without graph traversal or community summaries.
- Used on the `/eval` page to benchmark and prove GraphRAG's factual superiority.

---

## 3. Prerequisites & Environment Setup

### 3.1 Hardware Requirements
- **OS**: Windows 10/11, macOS, or Linux.
- **GPU**: NVIDIA RTX GPU with 6GB+ VRAM recommended (e.g. RTX 4060) or modern Apple Silicon (M1/M2/M3/M4).
- **RAM**: 16GB+ RAM.

### 3.2 Install & Configure Ollama
Install Ollama from [ollama.com](https://ollama.com) and pull the two required models:

```powershell
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

Ensure Ollama is running (`http://localhost:11434`).

---

## 4. Quickstart Installation Guide

Clone this repository:
```powershell
git clone https://github.com/your-username/local-graphrag.git
cd local-graphrag
```

### 4.1 Backend Setup (Python 3.11+)

1. Create and activate a Python virtual environment:
```powershell
# Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1

# macOS / Linux:
python3 -m venv venv
source venv/bin/activate
```

2. Install Python dependencies:
```powershell
pip install -r requirements.txt
```

3. Configure Environment Variables:
```powershell
cp .env.example .env
```
*(Optional: If you want to use LangSmith for tracing, add your `LANGSMITH_API_KEY` inside `.env`. If not, leave it empty; the app runs completely offline without it).*

---

### 4.2 Frontend Setup (Node.js 18+)

```powershell
cd frontend
npm install
```

---

## 5. Running the Application

Open two terminal windows to run both servers simultaneously:

### Terminal 1: Backend Server
From the root directory:
```powershell
.\venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base URL: `http://localhost:8000/api`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### Terminal 2: Frontend Client
From the `frontend/` directory:
```powershell
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 6. Frontend Motion Engine & Visual Architecture

The user interface follows a luxury editorial design language built from scratch with zero UI kits:
- **Physical Spring Solver (`spring.js`)**: Elements move using mass-spring-damper equations ($F = -kx - cv$) with 1ms substepping.
- **Reference-Counted Ticker (`ticker.js`)**: A centralized `requestAnimationFrame` loop that sleeps when no animations are running.
- **Lenis Smooth Scrolling**: Smooth, momentum-conserving page navigation integrated directly into the ticker.
- **Topographic Contour Shaders (`HeroScene.jsx`)**: Live Three.js WebGL canvas running a GLSL fragment shader simulating real-time terrain lines with cursor parallax.
- **Marching Squares (`contourCanvas.jsx`)**: 2D canvas running marching squares over a 96-cell grid to render topographic contours.
- **Catmull-Rom Circuit Spline (`CircuitBlock.jsx`)**: Parametric curved spline with curvature-based braking and baked halftone dot lattices.
- **Sticky Stack Receding (`useStickyStack.js`)**: Blocks 1–3 use `scale(0.9)` and `#0A0A0A` darkness shading (`0.55`) on inner wrappers as successive blocks scroll over them.
- **Descender-Safe Text Reveals (`textReveal.jsx`)**: Physics-based inline word/letter reveal without bounding-box clipping.
- **Signature Ball Cursor (`Cursor.jsx`)**: 10px round cursor with soft ring hover enlargement, magnetic button snapping, and text caret transformations.

---

## 7. REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/index/upload` | Upload `.txt` and `.pdf` files to `data/uploads/` |
| `POST` | `/api/index/run` | Run the full 7-stage indexing pipeline |
| `GET` | `/api/index/status` | Polling endpoint for indexing progress and counts |
| `POST` | `/api/query` | Execute question-answering in `auto`, `local`, or `global` mode |
| `POST` | `/api/feedback` | Submit binary thumbs up/down evaluation score to LangSmith |
| `GET` | `/api/graph` | Retrieve full graph topology or filter by community ID |
| `GET` | `/api/graph/stats` | Return node, edge, and community counts |
| `POST` | `/api/eval/run` | Execute automated benchmark evaluation across 10 questions |
| `GET` | `/api/eval/latest` | Retrieve latest benchmark scorecards and latency metrics |

---

## 8. Automated Evaluation Framework

Located in `backend/evaluation/`, this suite benchmarks answer quality across 10 curated questions:
1. **`evaluate_groundedness(context, answer)`** (`evaluators.py`): Checks whether every statement in the generated answer is directly supported by the context, returning a score from `0.0` to `1.0` (penalizing hallucinations).
2. **`evaluate_correctness(question, answer, reference)`** (`evaluators.py`): Compares the generated answer against ground-truth references for semantic accuracy.
3. **Benchmark Coordinator** (`evaluate.py`): Runs all 10 questions across **Local GraphRAG**, **Global GraphRAG**, and **Baseline Vector Search**, measuring latency, faithfulness, and win rates side-by-side on the `/eval` interface.

---

## 9. Verification & Production Build

To verify that the frontend compiles cleanly for production:
```powershell
cd frontend
npm run build
```
Output:
```
✓ 2377 modules transformed.
dist/index.html                     0.67 kB
dist/assets/index-Cr90JlkU.css     43.67 kB
dist/assets/index-C70Jq8zF.js    1,031.09 kB
✓ built in 10.43s
```

---

## 10. License

Distributed under the MIT License.
