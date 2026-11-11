"""FastAPI application entry point for Local GraphRAG backend."""

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.config import CORS_ORIGINS
from backend.api.routes_index import router as index_router
from backend.api.routes_query import router as query_router
from backend.api.routes_graph import router as graph_router
from backend.api.routes_eval import router as eval_router
from models.llm import check_ollama_health

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("graphrag.main")

app = FastAPI(
    title="Local GraphRAG API",
    description="Local Knowledge Graph Augmented Retrieval powered by Ollama and NetworkX",
    version="1.0.0",
)

# CORS configuration for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API route groups under /api prefix
app.include_router(index_router, prefix="/api")
app.include_router(query_router, prefix="/api")
app.include_router(graph_router, prefix="/api")
app.include_router(eval_router, prefix="/api")


@app.on_event("startup")
async def startup_check():
    """Verify Ollama availability and report status at server startup."""
    health = check_ollama_health()
    if health.get("ok"):
        logger.info("Ollama is reachable and models are verified ready.")
    else:
        logger.warning("Ollama check warning: %s", health.get("error"))


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Ensure all HTTP exceptions adhere to uniform {detail: ...} JSON contract."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail if isinstance(exc.detail, str) else str(exc.detail)},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Format request validation errors cleanly into human-readable detail messages."""
    first_error = exc.errors()[0] if exc.errors() else {}
    msg = first_error.get("msg", "Invalid request parameter.")
    loc = " -> ".join([str(x) for x in first_error.get("loc", []) if x != "body"])
    detail_msg = f"{loc}: {msg}" if loc else msg
    return JSONResponse(
        status_code=422,
        content={"detail": detail_msg},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all unhandled exception handler."""
    logger.exception("Unhandled server exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


@app.get("/api/health")
def api_health():
    """Comprehensive system health endpoint."""
    ollama_status = check_ollama_health()
    return {
        "status": "healthy" if ollama_status.get("ok") else "degraded",
        "ollama": ollama_status,
    }

