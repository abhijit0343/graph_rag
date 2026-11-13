# 📊 Evaluation Suite (`backend/evaluation/`)

> **Automated Benchmark & LLM-as-a-Judge Evaluation**  
> Empirically measures the performance delta between GraphRAG and Naive Vector RAG across Groundedness, Correctness, and Response Latency.

---

## 🔬 Benchmark Architecture

```
                    ┌─────────────────────────┐
                    │   eval_questions.json   │
                    │ (10 Benchmark Questions)│
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┴───────────────────┐
             ▼                                       ▼
 ┌───────────────────────┐               ┌───────────────────────┐
 │   GraphRAG Engine     │               │   Baseline Vector RAG │
 │  (Graph + FAISS + LLM)│               │   (Chunks FAISS + LLM)│
 └───────────┬───────────┘               └───────────┬───────────┘
             │                                       │
             │ [Answer + Context]                    │ [Answer + Context]
             ▼                                       ▼
 ┌───────────────────────────────────────────────────────────────┐
 │                  evaluators.py (Dual Judges)                  │
 ├───────────────────────────────────────────────────────────────┤
 │ 1. Groundedness Judge: Detects hallucinations vs context      │
 │ 2. Correctness Judge: Compares against ground truth answers   │
 └───────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    eval_results.json    │
                    │ Comparative Metrics &   │
                    │ Radar Chart Data Points │
                    └─────────────────────────┘
```

---

## 📄 File-by-File Technical Breakdown

### 1. [`evaluate.py`](file:///d:/agentic%20ai/graph_rag/backend/evaluation/evaluate.py)
* **Purpose**: Orchestrates the automated comparative test harness.
* **Execution Flow**:
  1. Loads 10 curated benchmark questions from `eval_questions.json`.
  2. For each question:
     * Executes GraphRAG search (capturing answer, active context, and runtime latency $\Delta t_{\text{graph}}$).
     * Executes Baseline naive vector search (capturing answer, retrieved chunks, and runtime latency $\Delta t_{\text{baseline}}$).
     * Invokes judges in `evaluators.py` to score both systems independently.
  3. Aggregates mean scores across all questions:
     $$\bar{S}_{\text{groundedness}} = \frac{1}{N} \sum_{i=1}^N S_i, \quad \bar{S}_{\text{correctness}} = \frac{1}{N} \sum_{i=1}^N C_i$$
  4. Saves complete structured comparative records into `data/storage/eval_results.json`.

### 2. [`evaluators.py`](file:///d:/agentic%20ai/graph_rag/backend/evaluation/evaluators.py)
* **Purpose**: Implements LLM-as-a-judge evaluation metrics.
* **Core Judges**:
  * `evaluate_groundedness(answer: str, context: str) -> JudgeScore`:
    * Utilizes `GROUNDEDNESS_JUDGE` prompt template.
    * Evaluates whether every factual claim made in the generated answer is directly substantiated by the retrieved context.
    * Penalizes any extraneous claims or hallucinations. Returns score $[0.0, 1.0]$ and explanatory reasoning.
  * `evaluate_correctness(answer: str, ground_truth: str) -> JudgeScore`:
    * Utilizes `CORRECTNESS_JUDGE` prompt template.
    * Evaluates semantic alignment and factual parity against pre-annotated ground truth answers.
    * Returns score $[0.0, 1.0]$ and explanatory reasoning.

### 3. [`eval_questions.json`](file:///d:/agentic%20ai/graph_rag/backend/evaluation/eval_questions.json)
* **Purpose**: Curated golden dataset containing 10 representative queries designed to test different reasoning modalities:
  * **Entity Lookups**: Questions targeting specific attributes of a single node.
  * **Multi-Hop Traversal**: Questions requiring connecting entities across multiple distinct documents.
  * **Thematic / Global**: Questions requiring corpus-wide synthesis and sensemaking.
* Each entry contains:
  * `id`: Unique question identifier.
  * `question`: Query text.
  * `expected_strategy`: `"local"` or `"global"`.
  * `ground_truth`: Authoritative expected factual answer.

