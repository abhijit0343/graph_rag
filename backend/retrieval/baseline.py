"""Standard vector-only baseline RAG implementation for comparative evaluation."""

from typing import Dict, Any, List
from backend.pipeline.stores import store
from backend.tracing import traceable
from models.llm import get_llm

BASELINE_SYSTEM = """You are a helpful research assistant.
Answer the user's question using only the provided text passages.
If the answer is not contained in the text, respond: "Information not found in the documents."
Keep your answer clear, factual, and concise.
"""

BASELINE_USER_TEMPLATE = """Question: {question}

Context Passages:
{passages}

Answer:
"""


@traceable(name="baseline_vector_rag", run_type="chain")
def run_baseline_search(question: str, top_k: int = 5) -> Dict[str, Any]:
    """Execute conventional vector-only semantic search RAG without knowledge graphs."""
    hits = store.chunks_faiss.search(question, top_k=top_k)

    if not hits:
        return {
            "answer": "No indexed documents found. Please index files first.",
            "mode_used": "baseline",
            "sources": {"entities": [], "paths": [], "chunks": []},
            "subgraph": {"nodes": [], "links": []},
        }

    chunks_data: List[Dict[str, Any]] = []
    passages_text_list: List[str] = []

    for meta, score in hits:
        chunks_data.append({
            "id": meta.get("id", "c_unknown"),
            "text": meta.get("text", ""),
            "file": meta.get("file", "unknown"),
            "similarity_score": round(score, 3),
        })
        passages_text_list.append(f"[{meta.get('file', '')}]:\n{meta.get('text', '')}")

    passages_str = "\n\n".join(passages_text_list)

    llm = get_llm(json_mode=False)
    messages = [
        ("system", BASELINE_SYSTEM),
        ("human", BASELINE_USER_TEMPLATE.format(question=question, passages=passages_str)),
    ]

    try:
        response = llm.invoke(messages)
        answer = response.content if hasattr(response, "content") else str(response)
    except Exception as e:
        answer = f"Error generating baseline answer: {str(e)}"

    return {
        "answer": answer.strip(),
        "mode_used": "baseline",
        "sources": {
            "entities": [],
            "paths": [],
            "chunks": chunks_data,
        },
        "subgraph": {"nodes": [], "links": []},
    }

