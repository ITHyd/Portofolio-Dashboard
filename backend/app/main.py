import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    auth,
    commercial,
    csat,
    dashboard,
    escalations,
    gov_checkpoints,
    imports,
    metrics,
    projects,
    resources,
    risks_issues,
    weekly_status,
)
from app.services.reminders import reminder_loop


@asynccontextmanager
async def lifespan(_: FastAPI):
    task = None
    if settings.reminder_enabled:
        task = asyncio.create_task(reminder_loop())
    try:
        yield
    finally:
        if task:
            task.cancel()


app = FastAPI(title="nxzen Portfolio Dashboard", version="0.1.0", lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(weekly_status.router)
app.include_router(risks_issues.router)
app.include_router(escalations.router)
app.include_router(commercial.router)
app.include_router(resources.router)
app.include_router(csat.router)
app.include_router(gov_checkpoints.router)
app.include_router(metrics.router)
app.include_router(dashboard.router)
app.include_router(imports.router)
