# Local GraphRAG — Editorial Intelligence System

> **A local, privacy-first Knowledge Graph Augmented Generation (GraphRAG) platform with an editorial, motion-led design system.**  
> Built with **FastAPI**, **React 18 + Vite**, **NetworkX**, **FAISS**, and **100% local AI inference** via **Ollama** (`llama3.2:3b` + `nomic-embed-text`). Includes optional tracing and evaluation with **LangSmith**.

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
├── models/                   # Pure AI layer (independent of backend & frontend)
│   ├── config.py             # Model names, Ollama base URL, temperatures, context window
│   ├── llm.py                # ChatOllama & OllamaEmbeddings factory with health checking
│   ├── prompts.py            # Few-shot prompts: extraction, community summary, router, map, reduce
│   ├── schemas.py            # Pydantic models: Entity, Relation, Route, MapAnswer, JudgeScore
│   └── cache.py              # SHA-256 disk cache for rapid reproducible LLM responses
├── backend/                  # Orchestration, graph pipeline, and API server
│   ├── main.py               # FastAPI application entrypoint with CORS & logging
│   ├── config.py             # Pipeline paths, chunk size (600/100), top-k, hops
│   ├── tracing.py            # LangSmith tracing decorators and run feedback
│   ├── api/                  # REST API routes
│   │   ├── routes_index.py   # Document upload and async indexing status
│   │   ├── routes_query.py   # Query routing (auto, local, global) and feedback
│   │   ├── routes_graph.py   # Subgraph topology and community filtering
│   │   └── routes_eval.py    # Benchmark execution and evaluation metrics
│   ├── pipeline/             # 7-stage Ingestion Pipeline
│   │   ├── loaders.py        # PDF and TXT file loaders
│   │   ├── chunking.py       # Sliding-window character/token chunking
│   │   ├── extract.py        # Few-shot entity and relationship extraction
│   │   ├── entity_merge.py   # Cross-document cosine deduplication and alias resolution
│   │   ├── graph_build.py    # NetworkX directed graph topology builder
│   │   ├── communities.py    # Louvain hierarchical community detection & summarization
│   │   ├── indexer.py        # Ingestion pipeline coordinator
│   │   └── stores.py         # Persistent FAISS indices & JSON storage manager
│   ├── retrieval/            # Retrieval engines
│   │   ├── router.py         # Semantic strategy classifier (Local vs. Global)
│   │   ├── local_search.py   # Entity matching + graph neighborhood expansion
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
        ├── App.jsx           # App layout and route switcher
        ├── api/client.js     # Axios API client with infinite timeout on LLM routes
        ├── engine/           # Hand-written physics and motion engine
        │   ├── readToken.js  # Dynamic CSS token extractor for WebGL and 2D canvas
        │   ├── ticker.js     # Reference-counted rAF tick loop integrated with Lenis
        │   ├── spring.js     # 1ms substepped physical mass-spring-damper solver
        │   ├── textReveal.jsx# Physics-based inline word/letter reveal without clipping
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
        │   ├── ErrorBanner.jsx# Dismissible notification banners
        │   └── Spinner.jsx   # Minimalist typography loading indicators
        ├── pages/            # Application views
        │   ├── home/         # Art-directed 5-block motion-led Home page (`/`)
        │   │   ├── Home.jsx         # Sticky stack coordinator
        │   │   ├── HeroBlock.jsx    # Block 1: WebGL scene, headline, bracket telemetry
        │   │   ├── HeroScene.jsx    # Three.js GLSL topographic shader & 360-node graph
        │   │   ├── CircuitBlock.jsx # Block 2: Halftone canvas & Catmull-Rom circuit lap
        │   │   ├── TimelineBlock.jsx# Block 3: Central rail & 7-stage plate timeline
        │   │   ├── QueryBlock.jsx   # Block 4: Force graph figure & 5-card query strip
        │   │   └── SignoffBlock.jsx # Block 5: Wireframe node-link canvas & footer
        │   ├── UploadIndex.jsx      # Route `/index`: Ingestion engine & drop zone
        │   ├── Ask.jsx              # Route `/ask`: Question-answering interface
        │   ├── GraphExplorer.jsx    # Route `/graph`: Fullscreen interactive graph visualizer
        │   └── Evaluation.jsx       # Route `/eval`: Benchmark test runner and metrics
        └── styles/           # CSS design system (tokens, reset, typography)
            ├── tokens.css    # Colors, fonts, transitions, and dark forest overrides
            ├── base.css      # Grid, ambient glow, paper grain, and container styling
            ├── components.css# Editorial buttons, input underlines, and cards
            └── cursor.css    # Custom ball cursor and hover states
```

---

## 2. Prerequisites & Environment Setup

### 2.1 Hardware Requirements
- **OS**: Windows 10/11, macOS, or Linux.
- **GPU**: NVIDIA RTX GPU with 6GB+ VRAM recommended (e.g. RTX 4060) or modern Apple Silicon (M1/M2/M3/M4).
- **RAM**: 16GB+ RAM.

### 2.2 Install & Configure Ollama
Install Ollama from [ollama.com](https://ollama.com) and pull the two required models:

```powershell
# In your terminal:
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

Ensure Ollama is running (`http://localhost:11434`).

---

## 3. Quickstart Installation Guide

Clone this repository:
```powershell
git clone https://github.com/your-username/local-graphrag.git
cd local-graphrag
```

### 3.1 Backend Setup (Python 3.11+)

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
# Copy the example environment file:
cp .env.example .env
```
*(Optional: If you want to use LangSmith for tracing, add your `LANGSMITH_API_KEY` inside `.env`. If not, leave it empty; the app runs completely offline without it).*

---

### 3.2 Frontend Setup (Node.js 18+)

```powershell
cd frontend
npm install
```

---

## 4. Running the Application

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

## 5. How GraphRAG Works

Traditional RAG relies solely on top-$k$ text chunk retrieval, which often struggles with broad, multi-hop, or high-level thematic questions. Local GraphRAG solves this by converting raw text into an interconnected knowledge graph and hierarchical community clusters:

### 5.1 The 7-Stage Ingestion Pipeline
1. **Chunking**: Text is segmented into 600-character windows with a 100-character sliding overlap.
2. **Extraction**: `llama3.2:3b` extracts canonical entities (Persons, Organizations, Technologies, Concepts) and active relationships in a single structured JSON pass.
3. **Entity Merging**: Embedding similarity deduplicates cross-document entities (e.g., merging *"Acme"* and *"Acme Corp"*).
4. **Graph Construction**: NetworkX compiles an interconnected directed graph with edge weights representing relationship frequency.
5. **Louvain Communities**: Hierarchical modularity clustering groups densely interconnected nodes into distinct topical communities.
6. **Community Summaries**: Map-reduce passes generate comprehensive editorial reports for each community cluster.
7. **Vector Indexing**: Three separate FAISS vector indexes (`chunks.index`, `entities.index`, `communities.index`) are built using `nomic-embed-text` and saved to disk.

### 5.2 Retrieval Modes
- **Local Search (`/ask` in `local` mode)**:
  1. Embeds query and retrieves top entities from `entities.index`.
  2. Traverses 1 to 2 hops across the NetworkX graph to collect the induced subgraph neighborhood.
  3. Synthesizes an exact, factual answer with zero hallucination.
  - *Best for*: Specific questions about entities, dates, relationships, or concrete facts. (Typical latency: 5–8 seconds).
- **Global Search (`/ask` in `global` mode)**:
  1. Searches `communities.index` to select candidate community reports.
  2. Map Phase: Evaluates each community report in parallel and generates scored partial answers.
  3. Reduce Phase: Combines the highest-scoring findings into an overarching executive summary.
  - *Best for*: High-level questions, dataset-wide themes, and cross-document comparisons. (Typical latency: ~35 seconds on local GPU).
- **Auto Router (`/ask` in `auto` mode)**:
  - An LLM semantic classifier inspects the user question and routes automatically between Local and Global search.

---

## 6. Frontend Motion Engine & Design Ethos

The user interface follows a bespoke, luxury editorial design language rather than a generic AI dashboard:
- **Zero Keyframes**: All dynamic movement is calculated frame-by-frame using a hand-crafted physical mass-spring-damper solver (`Spring` class with sub-millisecond integration).
- **Reference-Counted Ticker**: A centralized `requestAnimationFrame` loop that sleeps when no animations are running and throttles updates according to subscriber framerates.
- **Lenis Smooth Scrolling**: Smooth, momentum-conserving page navigation integrated directly into the ticker.
- **Topographic Contour Shaders**: Live GLSL and 2D canvas marching-squares algorithms (`CELLS=96`) drawing real-time topological terrain lines.
- **Sticky Stack Receding**: Blocks 1–3 use `scale(0.9)` and `#0A0A0A` darkness shading (`0.55`) on inner wrappers as successive blocks scroll over them.
- **Interactive Catmull-Rom Circuit**: Smooth parametric curves traced with real-time curvature braking and resting halftone dot lattices.
- **Signature Ball Cursor**: 10px round cursor with soft ring hover enlargement, magnetic button snapping, and text caret transformations.

---

## 7. REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/index/upload` | Upload `.txt` and `.pdf` files to `data/uploads/` |
| `POST` | `/api/index/run` | Run the full 7-stage indexing pipeline |
| `GET` | `/api/index/status` | Polling endpoint for indexing progress and counts |
| `POST` | `/api/query` | Execute question-answering in `auto`, `local`, or `global` mode |
| `POST` | `/api/feedback` | Submit binary thumbs up/down evaluation score |
| `GET` | `/api/graph` | Retrieve full graph topology or filter by community ID |
| `GET` | `/api/graph/stats` | Return node, edge, and community counts |
| `POST` | `/api/eval/run` | Execute automated benchmark evaluation across 10 questions |
| `GET` | `/api/eval/latest` | Retrieve latest benchmark scorecards and latency metrics |

---

## 8. Verification & Production Build

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
dist/assets/index-B5B0BWFF.js    1,032.86 kB
✓ built in 8.65s
```

---

## 9. License

Distributed under the MIT License. See `LICENSE` for more information.
