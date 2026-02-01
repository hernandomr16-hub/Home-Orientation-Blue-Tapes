from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .config import get_settings
from .database import engine, Base

# Import all models to register them with Base metadata
from .models import User, Project, Area, Contractor, ProjectContractor, Issue, IssuePhoto, ManualTemplate, ManualInstance

from .routers import auth, users, projects, areas, contractors, issues, reports, manual, notifications

settings = get_settings()

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Home Orientation Blue Tapes API",
    description="API for Blue Tape punch list and Home Owner Manual application",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS middleware - parse origins from settings
cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
# Add common development origins
cors_origins.extend([
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
])
# Remove duplicates
cors_origins = list(set(cors_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(areas.router)
app.include_router(contractors.router)
app.include_router(issues.router)
app.include_router(reports.router)
app.include_router(manual.router)
app.include_router(notifications.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "docs": "/api/docs"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
