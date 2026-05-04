from fastapi import FastAPI
from app.routers import analysis

app = FastAPI(title="Farm AI Server")

app.include_router(analysis.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
