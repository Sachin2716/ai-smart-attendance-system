from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import SessionLocal, engine, Base
from app.db.init_db import init_db
from app.api import auth, face, sessions, attendance, exceptions, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables and seed data exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real-world AI-based Face Recognition Attendance Management System with anti-spoof liveness detection and RBAC.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers (support both /api and /api/v1 paths seamlessly)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(face.router, prefix=settings.API_V1_STR)
app.include_router(face.router, prefix="/api/v1")
app.include_router(sessions.router, prefix=settings.API_V1_STR)
app.include_router(attendance.router, prefix=settings.API_V1_STR)
app.include_router(exceptions.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": settings.DATABASE_URL.split("://")[0]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
