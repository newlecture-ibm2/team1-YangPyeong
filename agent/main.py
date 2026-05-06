from fastapi import FastAPI

app = FastAPI(title="Farm Agent Server")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
