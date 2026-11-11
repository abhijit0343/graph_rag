"""Document loaders supporting .txt, .md, and .pdf files with metadata tracking."""

import os
from pathlib import Path
from typing import List, Dict, Any
from pypdf import PdfReader


def load_text_file(file_path: Path) -> str:
    """Read a plain text or markdown file with fallback encoding."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1") as f:
            return f.read()


def load_pdf_file(file_path: Path) -> str:
    """Extract text from all pages of a PDF file."""
    reader = PdfReader(str(file_path))
    pages_text: List[str] = []
    for idx, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            pages_text.append(text)
    return "\n\n".join(pages_text)


def load_documents_from_dir(directory: Path) -> List[Dict[str, Any]]:
    """Scan directory for supported files (.txt, .md, .pdf) and load contents."""
    documents: List[Dict[str, Any]] = []
    if not directory.exists():
        return documents

    for file_path in sorted(directory.iterdir()):
        if file_path.is_file():
            suffix = file_path.suffix.lower()
            content = ""
            if suffix in [".txt", ".md"]:
                content = load_text_file(file_path)
            elif suffix == ".pdf":
                try:
                    content = load_pdf_file(file_path)
                except Exception as e:
                    content = ""
            
            if content.strip():
                documents.append({
                    "filename": file_path.name,
                    "filepath": str(file_path),
                    "text": content.strip(),
                    "size_chars": len(content.strip())
                })
    return documents

