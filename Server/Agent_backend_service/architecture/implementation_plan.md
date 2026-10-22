# Integrating Python RAG Pipeline with Node.js Messaging System

## Background

The project has two separate technology stacks that need to communicate:
- **Node.js Express server** — handles auth, chat CRUD, and message persistence via Prisma + PostgreSQL
- **Python LangChain RAG pipeline** — uses Groq LLM + Pinecone vector store + contextual compression retriever to answer medical questions

The goal is to create a **`sendMessage`** route that:
1. Receives a user's question from the frontend
2. Saves the user's message to the database
3. Sends the question to the Python RAG pipeline
4. Saves the AI's response to the database
5. Returns both the answer and sources to the frontend

## Architecture

```mermaid
sequenceDiagram
    participant Client as React Client
    participant Node as Node.js Express<br/>(Port 3000)
    participant Python as FastAPI RAG Service<br/>(Port 8000)
    participant Pinecone as Pinecone Vector DB
    participant Groq as Groq LLM API

    Client->>Node: POST /api/chat/:id/message<br/>{content: "What is diabetes?"}
    Node->>Node: Save user message to PostgreSQL
    Node->>Python: POST http://localhost:8000/query<br/>{question: "What is diabetes?"}
    Python->>Pinecone: Similarity search (k=3)
    Pinecone-->>Python: Retrieved document chunks
    Python->>Groq: LLM call with context + question
    Groq-->>Python: Generated answer
    Python-->>Node: {answer: "...", sources: [...]}
    Node->>Node: Save assistant message to PostgreSQL
    Node-->>Client: {userMessage, assistantMessage, sources}
```

## User Review Required

> [!IMPORTANT]
> **Two-process architecture** — You will need to run **both** the Node.js server (`npm run dev`) and the Python FastAPI server (`uvicorn` or `python app.py`) simultaneously. We can add a convenience script later, but you'll manage two terminals during development.

> [!IMPORTANT]
> **Python dependencies** — You'll need to install `fastapi`, `uvicorn`, and `pydantic` in your Python environment (in addition to the LangChain dependencies you already have). We'll create a `requirements.txt`.

> [!WARNING]
> **Relative import in `langchain_chain.py`** — The current file uses `from ..helper.helper import ...` which assumes a package structure that doesn't match the flat `services/` directory. This will be fixed as part of the restructure.

## Open Questions

> [!IMPORTANT]
> **Chat history context** — Should the RAG pipeline receive previous messages from the chat as context (for multi-turn conversation), or is each question independent? The current plan treats each question independently, but we can add chat history if needed.

> [!IMPORTANT]
> **Credit deduction** — Your `User` model has a `credits` field (default 200). Should we deduct credits per message? If so, how many credits per query? The plan includes a placeholder for this.

> [!IMPORTANT]
> **Authentication** — The current `authMiddleware.js` sends a response instead of calling `next()`, so it can't be used as route-level middleware. Should we fix this so the message route is auth-protected? The plan includes this fix.

---

## Proposed Changes

### Component 1: Python FastAPI Microservice

Restructure the `services/` directory into a proper Python package with a FastAPI server that exposes the RAG chain via HTTP.

#### Directory structure after changes:
```
Server/services/
├── __init__.py          [NEW]
├── app.py               [NEW]  ← FastAPI entry point
├── helper.py            (existing, no changes)
├── prompt.py            (existing, no changes)
├── langchain_chain.py   [MODIFY] ← fix imports
└── requirements.txt     [NEW]
```

---

#### [NEW] `__init__.py`
Empty file to make `services/` a proper Python package so relative imports work.

---

#### [MODIFY] [langchain_chain.py](file:///home/sayandip-saha/Desktop/CODING/MERN%20STACK/Research_GPT/Server/services/langchain_chain.py)

Fix the broken relative imports to use package-local imports:

```diff
-from fastapi.concurrency import run_in_threadpool
-from ..helper.helper import load_llm, load_embedding_model, get_retriever, create_chain
-from ..helper.prompt import template
+from helper import load_llm, load_embedding_model, get_retriever, create_chain
+from prompt import template
```

Remove the `run_in_threadpool` import and the `invoke_chain_async` function (FastAPI will handle async in `app.py` instead).

---

#### [NEW] `app.py`

FastAPI server that:
- Initializes the LangChain chain on startup (lazy singleton via `get_chain()`)
- Exposes `POST /query` endpoint accepting `{question: string}`
- Runs the chain in a threadpool to avoid blocking the event loop
- Returns `{answer: string, sources: array}` 
- Includes CORS middleware for local development
- Includes a `GET /health` endpoint for Node.js to verify connectivity

```python
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from langchain_chain import get_chain
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")  # Share .env with Node.js

app = FastAPI(title="Research GPT RAG Service")

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
    return {"status": "ok"}

@app.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    try:
        chain = get_chain()
        result = await run_in_threadpool(chain.invoke, req.question)
        return QueryResponse(
            answer=result["answer"],
            sources=result.get("sources", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
```

---

#### [NEW] `requirements.txt`

```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
pydantic>=2.0.0
python-dotenv>=1.0.0
langchain-core>=0.3.0
langchain-community>=0.3.0
langchain-experimental>=0.3.0
langchain-groq>=0.2.0
langchain-huggingface>=0.1.0
langchain-pinecone>=0.2.0
pinecone-client>=5.0.0
```

---

### Component 2: Node.js Message Controller & Route

Create the messaging layer that bridges the Express API with the Python RAG service.

---

#### [NEW] [messageController.js](file:///home/sayandip-saha/Desktop/CODING/MERN%20STACK/Research_GPT/Server/src/controllers/messageController.js)

New controller with a `sendMessage` function that:

1. **Validates input** — requires `chatId` (from URL params), `userId` and `content` (from body)
2. **Verifies chat ownership** — ensures the chat belongs to the user
3. **Saves user message** — creates a Message record with `role: "user"`
4. **Calls Python RAG service** — `POST http://localhost:{RAG_PORT}/query` with the question
5. **Saves assistant message** — creates a Message record with `role: "assistant"` containing the LLM answer
6. **Returns response** — sends both messages + sources back to the client

```javascript
const { prisma } = require('../lib/prisma');
const joi = require('joi');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

const sendMessageSchema = joi.object({
    userId: joi.number().required(),
    content: joi.string().required().min(1).max(5000),
});

const sendMessage = async (req, res, next) => {
    const chatId = parseInt(req.params.id);
    const { userId, content } = req.body;

    const { error } = sendMessageSchema.validate({ userId, content });
    if (error) {
        return res.status(422).json({ success: false, message: error.details[0].message });
    }

    try {
        // 1. Verify chat exists and belongs to user
        const chat = await prisma.chat.findUnique({
            where: { id: chatId, userId: userId }
        });
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found!" });
        }

        // 2. Save user message
        const userMessage = await prisma.message.create({
            data: {
                chatId: chatId,
                role: "user",
                content: content,
            }
        });

        // 3. Call Python RAG service
        let assistantContent = "Sorry, I couldn't generate a response. Please try again.";
        let sources = [];

        try {
            const ragResponse = await fetch(`${RAG_SERVICE_URL}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: content }),
            });

            if (!ragResponse.ok) {
                throw new Error(`RAG service returned ${ragResponse.status}`);
            }

            const ragData = await ragResponse.json();
            assistantContent = ragData.answer;
            sources = ragData.sources || [];
        } catch (ragError) {
            console.error("RAG service error:", ragError.message);
            // Continue with fallback message — user message is already saved
        }

        // 4. Save assistant message
        const assistantMessage = await prisma.message.create({
            data: {
                chatId: chatId,
                role: "assistant",
                content: assistantContent,
            }
        });

        // 5. Return both messages + sources
        return res.status(201).json({
            success: true,
            message: "Message sent successfully!",
            userMessage,
            assistantMessage,
            sources,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error sending message!" });
    }
};

module.exports = { sendMessage };
```

**Key design decisions:**
- Uses native `fetch()` (available in Node 18+, which Express 5 requires) — no need for `axios`
- Gracefully degrades if the Python service is down (saves user message, returns a fallback)
- Sources from the RAG pipeline are forwarded to the client for citation display

---

#### [MODIFY] [chatRoutes.js](file:///home/sayandip-saha/Desktop/CODING/MERN%20STACK/Research_GPT/Server/src/routes/chatRoutes.js)

Add the new message route:

```diff
 const express = require('express');
 const {createChat, fetchChats, fetchChat, deleteChat, updateChatTitle} = require('../controllers/chatControllers');
+const {sendMessage} = require('../controllers/messageController');
 const router = express.Router();

 // You can add routes here later
 router.post('/create',createChat)
 router.post('/all',fetchChats)
+router.post('/:id/message', sendMessage)   // Send message & get AI response
 router.post('/:id',fetchChat)
 router.delete('/:id',deleteChat)
 router.put('/:id/title',updateChatTitle)
```

> [!IMPORTANT]
> The `/:id/message` route **must** be placed **before** the generic `/:id` route, otherwise Express will match `/:id` first and treat `"message"` as a chat ID.

---

### Component 3: Environment & Schema Enhancements

---

#### [MODIFY] [.env](file:///home/sayandip-saha/Desktop/CODING/MERN%20STACK/Research_GPT/Server/.env)

Add the RAG service URL:

```diff
 DATABASE_URL="postgresql://postgres:Saha%4006122004@localhost:5432/MedGPT_DB"
 PORT=3000
 JWT_SECRET_KEY=MGiNITMXcCF4brX1XV/Oc70dkCFeIUzNTA5waRiR3Jk=
+RAG_SERVICE_URL=http://localhost:8000
```

---

#### [MODIFY] [schema.prisma](file:///home/sayandip-saha/Desktop/CODING/MERN%20STACK/Research_GPT/Server/prisma/schema.prisma)

Add cascade delete so deleting a chat also deletes its messages:

```diff
 model Message {
   id Int @id @default(autoincrement())
   chatId Int
-  chat Chat @relation(fields: [chatId], references: [id])
+  chat Chat @relation(fields: [chatId], references: [id], onDelete: Cascade)
   role String
   content String
   isImage Boolean @default(false)
   isPublished Boolean @default(false)
   timestamp DateTime @default(now())
 }
```

> [!NOTE]
> After this change, run `npx prisma migrate dev --name add_cascade_delete` to apply the migration.

---

### Component 4 (Optional): Fix Auth Middleware

The current `authMiddleware.js` sends a response directly instead of calling `next()`, making it unusable as route-level middleware. If you want the message route to be protected:

#### [MODIFY] [authMiddleware.js](file:///home/sayandip-saha/Desktop/CODING/MERN%20STACK/Research_GPT/Server/src/middleware/authMiddleware.js)

```diff
 const authMiddleware = async (req,res,next)=>{
     const token = req.cookies.token;
     if(!token){
         return res.status(401).json({
             success: false,
             message: 'Unauthorized - No token provided'
         })
     }else{
         try {
             const decode = jwt.verify(token,process.env.JWT_SECRET_KEY);
             const user = await prisma.user.findUnique({where: {id: decode.id}});
             if(!user){
                 return res.status(401).json({
                     success: false,
                     message: "Unauthorized - Invalid token"
                 })
             }
-            return res.status(200).json({
-                success: true,
-                message: "User authorized successfully",
-                data: {
-                    id: user.id,
-                    name: user.name,
-                    email: user.email
-                }
-            })
+            req.user = {
+                id: user.id,
+                name: user.name,
+                email: user.email
+            };
+            next();
         } catch (error) {
```

This makes it a proper middleware that attaches `req.user` and passes control to the next handler. The `sendMessage` controller could then use `req.user.id` instead of requiring `userId` in the body (more secure).

---

## Summary of All Files

| File | Action | Purpose |
|------|--------|---------|
| `services/__init__.py` | **NEW** | Make services a Python package |
| `services/app.py` | **NEW** | FastAPI server exposing `/query` endpoint |
| `services/langchain_chain.py` | **MODIFY** | Fix broken imports |
| `services/requirements.txt` | **NEW** | Python dependencies |
| `src/controllers/messageController.js` | **NEW** | `sendMessage` controller |
| `src/routes/chatRoutes.js` | **MODIFY** | Add `/:id/message` route |
| `.env` | **MODIFY** | Add `RAG_SERVICE_URL` |
| `prisma/schema.prisma` | **MODIFY** | Add cascade delete |
| `src/middleware/authMiddleware.js` | **MODIFY** | Fix to work as proper middleware (optional) |

---

## Verification Plan

### Automated Tests

1. **Start Python service:**
   ```bash
   cd Server/services
   pip install -r requirements.txt
   python app.py
   ```

2. **Verify Python service health:**
   ```bash
   curl http://localhost:8000/health
   # Expected: {"status": "ok"}
   ```

3. **Test RAG query directly:**
   ```bash
   curl -X POST http://localhost:8000/query \
     -H "Content-Type: application/json" \
     -d '{"question": "What is diabetes?"}'
   # Expected: {"answer": "...", "sources": [...]}
   ```

4. **Apply Prisma migration:**
   ```bash
   cd Server
   npx prisma migrate dev --name add_cascade_delete
   ```

5. **Start Node.js server:**
   ```bash
   cd Server
   npm run dev
   ```

6. **Test full message flow (assuming you have a user and chat created):**
   ```bash
   curl -X POST http://localhost:3000/api/chat/1/message \
     -H "Content-Type: application/json" \
     -d '{"userId": 1, "content": "What are the symptoms of diabetes?"}'
   # Expected: {success: true, userMessage: {...}, assistantMessage: {...}, sources: [...]}
   ```

### Manual Verification

- Check PostgreSQL to confirm both user and assistant messages were persisted
- Verify the assistant message content is a proper RAG-generated response (not the fallback)
- Test with the Python service stopped to confirm graceful degradation
