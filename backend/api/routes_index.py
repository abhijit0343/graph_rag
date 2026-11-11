"""Index management and document upload routes."""

import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks

from backend.config import UPLOAD_DIR
from backend.pipeline.indexer import run_indexing_pipeline, index_tracker
from models.llm import check_ollama_health

router = APIRouter(tags=["Index"])


@router.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """Upload document files (.txt, .md, .pdf) for GraphRAG indexing."""
    if not files or len(files) == 0:
        raise HTTPException(
            status_code=400,
            detail="No files provided. Please select at least one .txt, .md, or .pdf file."
        )

    saved_filenames = []
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    for f in files:
        if not f.filename:
            continue
        suffix = f.filename.split(".")[-1].lower() if "." in f.filename else ""
        if suffix not in ["txt", "md", "pdf"]:
            continue

        target_path = UPLOAD_DIR / f.filename
        content = await f.read()
        if len(content) == 0:
            continue

        with open(target_path, "wb") as out_file:
            out_file.write(content)
        saved_filenames.append(f.filename)

    if not saved_filenames:
        raise HTTPException(
            status_code=400,
            detail="No valid text or PDF files were uploaded. Supported formats: .txt, .md, .pdf."
        )

    return {"saved": saved_filenames}


@router.post("/index")
def trigger_indexing(background_tasks: BackgroundTasks):
    """Trigger the GraphRAG indexing background process."""
    # 1. Health check Ollama
    health = check_ollama_health()
    if not health.get("ok"):
        raise HTTPException(status_code=503, detail=health.get("error", "Ollama is not reachable."))

    # 2. Check if upload dir has files
    files = list(UPLOAD_DIR.glob("*.*"))
    if not files:
        raise HTTPException(
            status_code=400,
            detail="No uploaded documents found. Please upload documents before triggering indexing."
        )

    # 3. Check current status
    status = index_tracker.get_status()
    if status["state"] == "running":
        raise HTTPException(status_code=409, detail="Indexing job is currently already running.")

    job_id = str(uuid.uuid4())
    background_tasks.add_task(run_indexing_pipeline)

    return {"job_id": job_id, "status": "started"}


@router.get("/index/status")
def get_indexing_status():
    """Retrieve current background indexing state and progress metrics."""
    return index_tracker.get_status()

