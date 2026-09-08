import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.app.api.routes import router as api_router
from contextlib import asynccontextmanager
from backend.app.config import BASE_DIR, MODEL_FILE_PATH, METRICS_FILE_PATH

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure ML model & evaluation metrics exist upon server start
    if not MODEL_FILE_PATH.exists() or not METRICS_FILE_PATH.exists():
        print("[Startup] ML model or metrics missing. Automatically training Random Forest model...")
        try:
            from backend.app.ml.train import train_and_evaluate
            train_and_evaluate()
            print("[Startup] ML model and metrics successfully generated.")
        except Exception as exc:
            print(f"[Startup] Warning: Could not train ML model on startup: {exc}")
    yield

app = FastAPI(
    title="CI Bottleneck Analyser API",
    description="Intelligent CI pipeline telemetry analysis, bottleneck detection, ML failure prediction, and explainable recommendations.",
    version="0.5.0-mvp",
    lifespan=lifespan
)

# Enable CORS for local development with Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router, prefix="/api")

# Mount built frontend if available
dist_dir = BASE_DIR / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="assets")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            return None
        file_path = dist_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(dist_dir / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "message": "Welcome to CI Bottleneck Analyser API (50% MVP)",
            "docs": "/docs",
            "health": "/api/health"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
