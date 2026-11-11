"""Chunking module using recursive character splitting with stable identifiers."""

from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter
from backend.config import CHUNK_SIZE, CHUNK_OVERLAP


def chunk_documents(
    documents: List[Dict[str, Any]],
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
) -> List[Dict[str, Any]]:
    """Split documents into character-bounded chunks with consistent identifiers.

    Returns a list of dicts with keys:
    - id: stable chunk ID (e.g. 'doc.txt_c0001')
    - text: chunk content string
    - file: source document filename
    - chunk_index: integer sequence number within document
    - char_count: length in characters
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )

    chunks: List[Dict[str, Any]] = []

    for doc in documents:
        filename = doc["filename"]
        raw_text = doc["text"]
        split_texts = splitter.split_text(raw_text)

        for idx, text_seg in enumerate(split_texts):
            clean_text = text_seg.strip()
            if not clean_text:
                continue
            chunk_id = f"{filename}_c{idx:04d}"
            chunks.append({
                "id": chunk_id,
                "text": clean_text,
                "file": filename,
                "chunk_index": idx,
                "char_count": len(clean_text)
            })

    return chunks

