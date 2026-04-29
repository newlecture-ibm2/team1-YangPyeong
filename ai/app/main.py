from fastapi import FastAPI

app = FastAPI(title="Farm AI Server")

@app.get("/health")
async def health():
    return {"status": "ok"}
