# Walkthrough: RAG Pipeline ↔ Node.js Messaging Integration

## What Changed

This integration bridges the **Python LangChain RAG pipeline** with the **Node.js Express chat system** using a FastAPI microservice architecture.

### New Files Created (4)

| File | Purpose |
|------|---------|
| [__init__.py](file:///home/sayandip-saha/Desktop/CODING/MERN%20STACK/Research_GPT/Server/services/__init__.py) | Makes `services/` a Python package |
| [app.py](file:///home/sayandip-saha/Desktop/CODING/MERN%20STACK/Research_GPT/Server/services/app.py) | FastAPI server exposing `/query` and `/health` endpoints |
| [requirements.txt](file:///home/sayandip-saha/Desktop/CODING/MERN%20STACK/Research_GPT/Server/services/requirements.txt) | Python dependencies for the RAG service |
| [messageController.js](file:///home/sayandip-saha/Desktop/CODING/MERN%20STACK/Research_GPT/Server/src/controllers/messageController.js) | `sendMessage` controller — saves user message, calls RAG, saves AI response |

### Files Modified (5)

| File | Change |
|------|--------|
| [langchain_chain.py](file:///home/sayandip-saha/Desktop/CODING/MERN%20STACK/Research_GPT/Server/services/langchain_chain.py) | Fixed broken relative imports to local imports |
| [chatRoutes.js](file:///home/sayandip-saha/Desktop/CODING/MERN%20STACK/Research_GPT/Server/src/routes/chatRoutes.js) | Added `POST /:id/message` route |
| [.env](file:///home/sayandip-saha/Desktop/CODING/MERN%20STACK/Research_GPT/Server/.env) | Added `RAG_SERVICE_URL=http://localhost:8000` |
| [schema.prisma](file:///home/sayandip-saha/Desktop/CODING/MERN%20STACK/Research_GPT/Server/prisma/schema.prisma) | Added `onDelete: Cascade` to Message→Chat relation |
| [authMiddleware.js](file:///home/sayandip-saha/Desktop/CODING/MERN%20STACK/Research_GPT/Server/src/middleware/authMiddleware.js) | Fixed to attach `req.user` and call `next()` instead of sending response |

## Message Flow

```
Client → POST /api/chat/:id/message {userId, content}
  → Node.js saves user message to PostgreSQL
  → Node.js calls Python FastAPI at POST /query {question}
    → RAG pipeline: Pinecone retrieval → Groq LLM → answer + sources
  → Node.js saves assistant message to PostgreSQL
  → Returns {userMessage, assistantMessage, sources}
```

## Verification

- ✅ Node.js modules load without errors (verified with `node -e` test)
- The Prisma schema change requires running: `npx prisma migrate dev --name add_cascade_delete`
- The Python service requires: `cd services && pip install -r requirements.txt && python app.py`

## Next Steps To Run

1. **Install Python deps**: `cd Server/services && pip install -r requirements.txt`
2. **Run Prisma migration**: `cd Server && npx prisma migrate dev --name add_cascade_delete`
3. **Start Python service**: `cd Server/services && python app.py` (runs on port 8000)
4. **Start Node.js server**: `cd Server && npm run dev` (runs on port 3000)
5. **Test**: `curl -X POST http://localhost:3000/api/chat/1/message -H "Content-Type: application/json" -d '{"userId": 1, "content": "What is diabetes?"}'`
