import os
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .api import router as api_router
from .database import init_db

# Load env vars
load_dotenv()

app = FastAPI(title="Reviews Copilot", version="0.1")

# Configure CORS
frontend_url = os.getenv("FRONTEND_URL", "")
origins = [
    "http://localhost:5173",   
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "https://reviews-copilot-delta.vercel.app"
]
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key
API_KEY = os.getenv("API_KEY", "changeme")

def get_api_key(x_api_key: str | None = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return x_api_key

# Initialize DB
init_db()

# Register router
app.include_router(api_router, prefix="/api")


# Health check endpoint (for testing / deployment pings)
@app.get("/health")
def health():
    return {"status": "ok"}
