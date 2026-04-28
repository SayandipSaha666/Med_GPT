import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from langchain_chain import get_chain
from dotenv import load_dotenv

# Load environment variables from the shared .env file
load_dotenv(dotenv_path="../.env")

app = FastAPI(title="MedGPT RAG Service")

# Allow Node.js server to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    answer: str
    sources: list


@app.get("/health")
async def health():
    """Health check endpoint for Node.js to verify connectivity."""
    return {"status": "ok"}


@app.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    """
    Accepts a user question, runs it through the LangChain RAG pipeline,
    and returns the generated answer along with source documents.
    """
    try:
        chain = get_chain()
        # Run the blocking LangChain call in a threadpool
        # to prevent blocking the FastAPI event loop
        result = await run_in_threadpool(chain.invoke, req.question)
        return QueryResponse(
            answer=result["answer"],
            sources=result.get("sources", [])
        )
    except Exception as e:
        print(f"❌ RAG pipeline error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
