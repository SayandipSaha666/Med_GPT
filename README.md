# Med_GPT 🩺

**Med_GPT** is a production-grade, full-stack **Retrieval-Augmented Generation (RAG)** application. It combines a robust MERN stack architecture with a high-performance Python-based AI service to provide context-aware medical information.

The system allows users to create persistent chat sessions, ask complex medical questions, and receive answers sourced from trusted medical documentation using semantic search.

---

## 🚀 Key Features

### 🔐 Secure Authentication
- **JWT-based Auth**: Secure user sessions using JSON Web Tokens.
- **Prisma ORM**: Type-safe database interactions with PostgreSQL.
- **Subscription Plans**: Integrated "Free" and "Pro" plan system.

### 💬 Advanced Chat System
- **Persistent History**: All conversations are stored and retrieved from PostgreSQL.
- **Multi-Chat Support**: Users can manage multiple research threads simultaneously.
- **Real-time UI**: Responsive interface built with React and Tailwind CSS.

### 🧠 RAG Pipeline (AI Service)
- **Semantic Search**: Powered by **Pinecone** vector database.
- **High-Performance LLM**: Uses **Groq (OpenAI GPT-OSS 120B)** for lightning-fast inference.
- **Semantic Chunking**: Advanced document processing using `langchain-experimental`.
- **HuggingFace Embeddings**: State-of-the-art open-source embedding models.

### 💳 Payment Integration
- **Razorpay**: Integrated payment gateway for upgrading to multiple plans.
- **Webhook Support**: Secure, server-side verification of payment status.

---

## 🛠️ Tech Stack

### Frontend
- **React (Vite)**
- **Tailwind CSS** (Styling)
- **Lucide React** (Icons)
- **Axios** (API Communication)

### Backend (Node.js)
- **Express.js**
- **Prisma** (ORM)
- **PostgreSQL** (NeonDB)
- **Razorpay SDK**
- **JWT** (Authentication)

### AI Service (Python)
- **FastAPI**
- **LangChain** (Orchestration)
- **Pinecone** (Vector Database)
- **Groq API** (OpenAI GPT-OSS 120B)
- **Uvicorn** (Asynchronous Server)

---

## 📂 Project Structure

```
Research_GPT/
├── Client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Global state (Auth/Chat)
│   │   ├── routes/         # Page components (Home, Chat, Auth)
│   │   └── services/       # API call handlers
│   └── Dockerfile
│
├── Server/
│   ├── user_service/           # Node.js User Service (Express)
│   │   ├── index.ts            # Entry point (port 3000)
│   │   ├── prisma/             # Schema and Migrations
│   │   ├── src/
│   │   │   ├── controllers/    # Auth, users, chats, messages, files, billing
│   │   │   ├── services/       # Business logic + agent client
│   │   │   ├── middleware/     # Auth & Validation
│   │   │   └── routes/         # Express API routes
│   │   ├── .env                # User service environment variables
│   │   └── Dockerfile          # User service Dockerfile
│   ├── Agent_backend_service/  # Node.js Agent Service (Express)
│   │   ├── index.ts            # Entry point (port 4001)
│   │   ├── prisma/             # Shared schema for agent tool queries
│   │   ├── src/
│   │   │   ├── agents/         # Multi-agent system, tools, guardrails
│   │   │   ├── lib/            # Prisma client
│   │   │   └── agents/api/     # Internal /agent HTTP API
│   │   ├── .env                # Agent service environment variables
│   │   └── Dockerfile          # Agent service Dockerfile
│   └── RAG_Service/            # Python RAG Service (FastAPI)
│       ├── app.py              # FastAPI entry point
│       ├── helper.py           # Vector store & LLM logic
│       ├── langchain_chain.py  # Chain orchestration
│       ├── prompt.py           # Prompt engineering
│       ├── Dockerfile          # RAG service Dockerfile
│       ├── .env                # RAG service environment variables
│       └── prod-requirements.txt # RAG service dependencies
|
├── docker-compose.yml      # Orchestrates all services
└── README.md
```

---

## ⚙️ Environment Variables

### User Service (`Server/user_service/.env`)
```env
PORT=3000
DATABASE_URL="postgresql://user:password@host:port/db?sslmode=require"
JWT_SECRET_KEY="your_secret_hex_string"
RAG_SERVICE_URL=http://localhost:8000
AGENT_SERVICE_URL=http://localhost:4001
AGENT_SERVICE_API_KEY="shared_internal_secret"
FRONTEND_ALLOWED_ORIGINS=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=xxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxx
```

### Agent Service (`Server/Agent_backend_service/.env`)
```env
PORT=4001
DATABASE_URL="postgresql://user:password@host:port/db?sslmode=require"
RAG_SERVICE_URL=http://localhost:8000
AGENT_SERVICE_API_KEY="shared_internal_secret"
MODEL_PROVIDER=openai
OPENAI_AGENT_API_KEY="your_openai_key"
OPENAI_AGENT_MODEL=gpt-4o
GUARDRAILS_ENABLED=true
ENCRYPTION_MASTER_KEY="your_encryption_key"
```

### AI Service (`Server/RAG_Service/.env`)
```env
PINECONE_API_KEY="your_pinecone_key"
GROQ_API_KEY="your_groq_key"
HUGGINGFACEHUB_API_TOKEN="your_hf_token"
BACKEND_ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (`Client/.env`)
```env
VITE_SERVER_URL=http://localhost:3000
```

---

## 🛠️ Setup Guide

### 1. Database Setup
```bash
cd Server/user_service
npx prisma generate
npx prisma db push
npm run seed      # To populate Free/Pro plans
```

### 2. AI Service Setup
```bash
cd Server/RAG_Service
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r prod-requirements.txt
python app.py
```

### 3. Agent Service Setup
```bash
cd Server/Agent_backend_service
npm install
npx prisma generate
npm run dev       # Starts on port 4001
```

### 4. User Service Setup
```bash
cd Server/user_service
npm install
npm run dev       # Starts on port 3000
```

### 5. Frontend Setup
```bash
cd Client
npm install
npm run dev
```

---

## 📜 License & Disclaimer

This project is for **Educational and Research Purposes only**. It is not intended to provide real medical advice or diagnosis. Always consult a professional healthcare provider for medical concerns.

---

## 🙌 Acknowledgements

- **LangChain** for the AI orchestration framework.
- **Groq** for providing ultra-fast Llama-3 inference.
- **Pinecone** for the scalable vector search infrastructure.
- **NeonDB** for the serverless PostgreSQL hosting.

**Developed with ❤️ by [Sayandip Saha](https://github.com/SayandipSaha666)**
