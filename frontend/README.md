# 🎨 Frontend Web Application (`frontend/`)

> **Motion-Led Editorial React Experience**  
> An art-directed single-page application built with React 18, Vite, Three.js WebGL shaders, and a custom mass-spring-damper physics engine. No CSS animation libraries (no GSAP, no Framer Motion).

---

## 📂 Frontend Directory Architecture

```
frontend/src/
├── App.jsx               # Layout coordinator, background layers & route definitions
├── main.jsx              # DOM entrypoint, token loading & font initialization
├── api/
│   └── client.js         # Axios HTTP client with infinite timeouts for LLM routes
├── engine/               # Hand-crafted physics and rendering engine
│   ├── spring.js         # 1ms substepped second-order spring solver (F = -kx - cv)
│   ├── ticker.js         # Reference-counted requestAnimationFrame loop + Lenis
│   ├── readToken.js      # Dynamic CSS variable extractor for Canvas & WebGL
│   ├── scrollTrigger.js  # Viewport scroll intersection and progress math
│   ├── useStickyStack.js # Block recede scale (0.9) and dark shading calculations
│   ├── textReveal.jsx    # Physics-based inline word/letter reveal
│   ├── contourCanvas.jsx # 2D Marching Squares isocontour canvas (96 cells)
│   └── chequeredDissolve.jsx # Seam transition dissolve via pseudorandom noise
├── components/           # Reusable editorial UI widgets
│   ├── Navbar.jsx        # Floating header with hairline border & active routes
│   ├── Cursor.jsx        # Custom 10px signature ball cursor with ring magnet
│   ├── GraphView.jsx     # 2D interactive force-directed canvas graph visualizer
│   ├── SourceCard.jsx    # Editorial evidence citations with chunk metadata
│   ├── MagneticButton.jsx# Physical button snapping to cursor physics
│   ├── LoadingVeil.jsx   # Node-link glyph sheet with physical spring exit
│   ├── Spinner.jsx       # Minimalist typographic progress spinner
│   ├── ErrorBanner.jsx   # Dismissible notification banners
│   └── StatusBadge.jsx   # Ingestion status badges
├── pages/                # Main Application Views
│   ├── home/             # 5-Block art-directed editorial landing page
│   │   ├── Home.jsx             # Sticky stack container
│   │   ├── HeroBlock.jsx        # Block 1: Headline, bracket telemetry, CTA
│   │   ├── HeroScene.jsx        # Three.js GLSL topographic shader & 360-node graph
│   │   ├── CircuitBlock.jsx     # Block 2: Halftone canvas & Catmull-Rom circuit
│   │   ├── TimelineBlock.jsx    # Block 3: Central rail & 7-stage plate timeline
│   │   ├── QueryBlock.jsx       # Block 4: Force graph figure & 5-card query strip
│   │   └── SignoffBlock.jsx     # Block 5: Wireframe node-link canvas & footer
│   ├── UploadIndex.jsx   # Route /index: Document dropzone & live 7-stage progress
│   ├── Ask.jsx           # Route /ask: Query interface with graph & source citations
│   ├── GraphExplorer.jsx # Route /graph: Fullscreen interactive graph visualizer
│   └── Evaluation.jsx    # Route /eval: Benchmark runner & comparative metrics
└── styles/               # Bespoke design system
    ├── tokens.css        # Colors (#ECEAE6, #0F2A1D), fonts, transitions
    ├── base.css          # Background grid, ambient dark-red glow, paper-grain
    ├── components.css    # Editorial buttons, cards, inputs
    └── cursor.css        # Custom cursor hover states
```

---

## 📄 Core Subsystem Deep-Dive

### 1. The Physics & Motion Engine (`src/engine/`)
Instead of relying on heavy third-party animation libraries, all transitions and animations are computed from first principles:

* **Analytical Spring Solver ([`spring.js`](file:///d:/agentic%20ai/graph_rag/frontend/src/engine/spring.js))**:
  * Simulates a continuous damped harmonic oscillator:
    $$F = -kx - cv$$
  * Evaluated using a **1-millisecond substepped numerical integrator** to ensure absolute mathematical stability and prevent overshoot explosion.
  * Presets: `GENTLE` (stiff: 120, damp: 14), `SNAPPY` (stiff: 280, damp: 22), `BOUNCY` (stiff: 180, damp: 12), and `REVEAL` (stiff: 90, damp: 18).
* **Unified Single rAF Loop ([`ticker.js`](file:///d:/agentic%20ai/graph_rag/frontend/src/engine/ticker.js))**:
  * Reference-counted animation loop. Ensures only one `requestAnimationFrame` runs globally.
  * Integrates seamlessly with **Lenis** smooth scroll.
* **2D Marching Squares ([`contourCanvas.jsx`](file:///d:/agentic%20ai/graph_rag/frontend/src/engine/contourCanvas.jsx))**:
  * Computes real-time scalar fields over a $96 \times 96$ cell grid to generate organic topographic contour lines dynamically.
* **Sticky Stack Mathematics ([`useStickyStack.js`](file:///d:/agentic%20ai/graph_rag/frontend/src/engine/useStickyStack.js))**:
  * Scales back prior cards by `0.9` and blends dark shading at `0.55` as subsequent blocks scroll over them.

### 2. Application Pages (`src/pages/`)

* **Home (`/`)**:
  * An art-directed 5-block editorial experience with interactive WebGL Three.js shaders ([`HeroScene.jsx`](file:///d:/agentic%20ai/graph_rag/frontend/src/pages/home/HeroScene.jsx)) containing a 360-node particle graph, Catmull-Rom circuit animation, and 7-stage plate timeline.
* **Upload & Ingestion (`/index`)**:
  * Drag-and-drop document upload with real-time SSE progress polling from `/api/index/status`. Displays animated 7-stage plate steps and telemetry badges.
* **Ask (`/ask`)**:
  * Interactive query interface supporting Auto-Routing, Local Search, Global Search, and Baseline Naive search. Displays synthesized answers, active sub-graph entities, relationship badges, and source chunk quotes.
* **Graph Explorer (`/graph`)**:
  * Interactive fullscreen knowledge graph explorer. Features zoom, pan, node physics, community cluster color-coding, and detailed node-inspection side panels.
* **Evaluation (`/eval`)**:
  * Real-time benchmark runner executing the 10-question evaluation dataset. Shows side-by-side radar and bar charts comparing GraphRAG against Naive Baseline on Groundedness, Correctness, and Latency.

---

## 🛠️ Development & Production Build

From the `frontend/` directory:

```powershell
# 1. Install dependencies
npm install

# 2. Run local development server (Port 5173)
npm run dev

# 3. Compile optimized production build
npm run build
```

