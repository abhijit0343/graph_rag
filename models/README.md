# 🧠 Models Tier (`models/`)

> **The Pure Cognitive & Contract Layer**  
> This package encapsulates all AI model configurations, prompt engineering, Pydantic data validation schemas, deterministic response caching, and Ollama client factories. It has **zero dependencies** on FastAPI or the frontend.

---

## 📂 Directory Layout

```
models/
├── config.py       # Hyperparameters, context windows, Ollama endpoints & model tags
├── llm.py          # ChatOllama & OllamaEmbeddings client factory with health probing
├── schemas.py      # Pydantic v2 schemas for all structured inputs and outputs
├── prompts.py      # Few-shot prompts for extraction, community summarization, routing & judges
└── cache.py        # Deterministic SHA-256 disk cache for reproducible inference
```

---

## 📄 File-by-File Technical Breakdown

### 1. [`config.py`](file:///d:/agentic%20ai/graph_rag/models/config.py)
* **Purpose**: Single source of truth for all AI model parameters.
* **Key Constants**:
  * `OLLAMA_BASE_URL`: Defaults to `http://localhost:11434` (configurable via `.env`).
  * `PRIMARY_MODEL`: `llama3.2:3b` — Used for entity extraction, community summarization, answer synthesis, query routing, and LLM-as-a-judge evaluations.
  * `EMBEDDING_MODEL`: `nomic-embed-text` — 768-dimensional local dense embeddings for cosine deduplication and FAISS indexing.
  * `CONTEXT_WINDOW`: Set to `4096` tokens.
  * `TEMPERATURE`: Forced to `0.0` for extraction, routing, and judge tasks to guarantee deterministic, reproducible structured outputs. Set to `0.2` for natural language answer synthesis.

### 2. [`llm.py`](file:///d:/agentic%20ai/graph_rag/models/llm.py)
* **Purpose**: Factory providing resilient, verified client instances to Ollama.
* **Key Functions**:
  * `get_llm(temperature: float = 0.0, format: str = None) -> ChatOllama`: Creates a LangChain `ChatOllama` instance with specified sampling temperature. When `format="json"` is passed, Ollama strictly constrains output token sampling to valid JSON.
  * `get_embeddings() -> OllamaEmbeddings`: Provides the local vector embedding client targeting `nomic-embed-text`.
  * `check_ollama_health() -> Tuple[bool, str]`: Probes `http://localhost:11434/api/tags` on application startup to ensure Ollama is active and both `llama3.2:3b` and `nomic-embed-text` are downloaded locally.

### 3. [`schemas.py`](file:///d:/agentic%20ai/graph_rag/models/schemas.py)
* **Purpose**: Strict Pydantic v2 schema definitions ensuring compile-time and runtime type safety.
* **Core Models**:
  * `Entity`: Extracted entity containing `name` (str), `type` (e.g. `PERSON`, `ORGANIZATION`, `CONCEPT`), and `description` (str).
  * `Relation`: Relationship tuple containing `source` (str), `target` (str), `relationship` (str), and `weight` (float).
  * `ExtractionResult`: Container holding `entities: List[Entity]` and `relations: List[Relation]`.
  * `RouteSelection`: Query classifier output: `strategy: Literal["local", "global"]` and `reasoning: str`.
  * `CommunityReport`: Thematic summary of a graph cluster containing `id`, `title`, `summary`, `key_entities`, and `rating`.
  * `MapAnswer` & `GlobalAnswer`: Intermediate map outputs and final synthesized reduce answers for global thematic searches.
  * `JudgeScore`: LLM-as-a-judge evaluation contract: `score: float` (0.0 to 1.0) and `reasoning: str`.

### 4. [`prompts.py`](file:///d:/agentic%20ai/graph_rag/models/prompts.py)
* **Purpose**: Hand-crafted, few-shot prompt templates designed specifically for small local models (3B parameters).
* **Key Prompts**:
  * `EXTRACTION_SYSTEM` & `EXTRACTION_USER`: Few-shot guide instructing Llama 3.2 3B to extract entities and relations into a standardized JSON structure.
  * `COMMUNITY_REPORT_PROMPT`: Instructs the model to read all entities and relationships within a Louvain cluster and generate a comprehensive thematic overview.
  * `ROUTER_SYSTEM` & `ROUTER_USER`: Classifies user queries into either **Local Search** (entity-specific) or **Global Search** (corpus-wide thematic sensemaking).
  * `LOCAL_ANSWER_SYSTEM`: Synthesizes answers using retrieved 2-hop graph paths and chunk context. Includes conversational fallback for greetings and strict grounding to prevent hallucinations.
  * `MAP_SYSTEM` & `REDUCE_SYSTEM`: Powers global community Map-Reduce summarization.
  * `GROUNDEDNESS_JUDGE` & `CORRECTNESS_JUDGE`: Evaluates retrieval and generation quality against ground truth.

### 5. [`cache.py`](file:///d:/agentic%20ai/graph_rag/models/cache.py)
* **Purpose**: File-based SHA-256 disk cache for LLM inference results.
* **Workflow**:
  * Computes a SHA-256 hash of `(model_name, temperature, prompt_text)`.
  * Checks `.cache/llm/<hash>.json`.
  * On cache hit: Returns the saved response in `~1ms`, bypassing the local GPU/CPU inference step.
  * On cache miss: Calls Ollama, stores the response on disk, and returns the result.
  * Crucial for fast re-runs, reproducible benchmarking, and unit testing.

---

## 🔄 Interaction with Other Layers

```
backend/pipeline/extract.py ──────> models/llm.py (ChatOllama)
                            ──────> models/prompts.py (EXTRACTION_PROMPT)
                            ──────> models/schemas.py (ExtractionResult)
                            ──────> models/cache.py (SHA-256 Disk Cache)

backend/retrieval/router.py  ──────> models/prompts.py (ROUTER_PROMPT)
                            ──────> models/schemas.py (RouteSelection)
```

No module inside `models/` ever imports from `backend` or `frontend`.

