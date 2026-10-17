# How the Agent Combines Multiple Data Sources

> The core question: Should everything live in a vector DB, or does the agent pull from multiple stores?

**Answer: The agent pulls from BOTH vector DB AND PostgreSQL, and the LLM itself acts as the combiner.**

---

## Why NOT Put Everything in the Vector DB

| Data Type | Vector DB (Pinecone) | PostgreSQL | Why? |
|-----------|---------------------|------------|------|
| Medical documents / textbook content | ✅ | ❌ | Unstructured text → semantic search works perfectly |
| Web search knowledge entries | ✅ (embeddings) | ✅ (full text + metadata) | Both — vector for semantic retrieval, PG for exact lookups |
| Prescription medications | ❌ | ✅ | Structured data (drug name, dosage, frequency) — you need exact queries like "what medications was I prescribed?" |
| User medical profile (allergies, conditions) | ❌ | ✅ (encrypted) | PII that needs encryption + exact field access |
| Conversation history | ❌ | ✅ | Sequential data with timestamps, needs ordered retrieval |
| Appointment records | ❌ | ✅ | Transactional data with status, dates, foreign keys |

> [!IMPORTANT]
> Vector DBs excel at **"find me things similar to X"** but are terrible at **"get me the exact medications from prescription #ABC"** or **"what are this user's allergies?"**. PostgreSQL excels at exact, structured queries. You need both.

---

## The Agent as Orchestrator — How It Actually Works

The LLM agent is the **combiner**. It doesn't get all data upfront — it **decides which tools to call** based on the query, gets results from each, and synthesizes everything in its context window.

```
User Query: "I've been having chest pain after eating. My doctor 
             prescribed Omeprazole last month. Is this related?"

                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    GATEWAY AGENT (gpt-4o-mini)                   │
│                                                                  │
│  Intent: department_specific → cardiology (chest pain)           │
│  But also involves prescription history → needs multiple tools   │
│                                                                  │
│  → Hands off to: Cardiology Specialist                           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│               CARDIOLOGY AGENT (gpt-4o)                          │
│                                                                  │
│  The LLM analyzes the query and decides to call these tools:     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  TOOL CALL 1: search_medical_knowledge                     │  │
│  │  Query: "chest pain after eating gastric cardiac causes"    │  │
│  │  Source: Pinecone vector DB                                │  │
│  │                                                            │  │
│  │  Returns: Relevant medical knowledge about GERD vs cardiac │  │
│  │  chest pain, differential diagnosis context, etc.          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  TOOL CALL 2: get_prescription_history                     │  │
│  │  userId: 42, limit: 5                                      │  │
│  │  Source: PostgreSQL prescriptions table                    │  │
│  │                                                            │  │
│  │  Returns: [{                                               │  │
│  │    medications: [{ name: "Omeprazole", dosage: "20mg",     │  │
│  │    frequency: "once daily" }],                             │  │
│  │    dateIssued: "2026-09-15",                               │  │
│  │    overallAssessment: "GERD / acid reflux management"      │  │
│  │  }]                                                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  TOOL CALL 3: get_patient_profile                          │  │
│  │  userId: 42, fields: ["allergies", "conditions"]           │  │
│  │  Source: PostgreSQL medical_profiles table (decrypted)     │  │
│  │                                                            │  │
│  │  Returns: {                                                │  │
│  │    allergies: ["Penicillin"],                              │  │
│  │    conditions: ["Hypertension", "GERD"]                    │  │
│  │  }                                                         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  TOOL CALL 4: search_knowledge_base          (NEW TOOL)   │  │
│  │  Query: "Omeprazole chest pain interaction"                │  │
│  │  Source: PostgreSQL knowledge_entries table                │  │
│  │                                                            │  │
│  │  Returns: Knowledge entry from a previous web search       │  │
│  │  about Omeprazole side effects and GERD management         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ════════════════════════════════════════════════════════════════ │
│                                                                  │
│  NOW THE LLM HAS ALL CONTEXT IN ITS WINDOW:                     │
│                                                                  │
│  • Vector DB results: medical knowledge about chest pain causes  │
│  • Prescription data: Omeprazole 20mg for GERD                  │
│  • Patient profile: has GERD + Hypertension, allergic to Pen.   │
│  • Knowledge base: Omeprazole info from past web search          │
│  • Conversation history: (from context)                          │
│                                                                  │
│  → LLM SYNTHESIZES a unified response:                           │
│                                                                  │
│  "Based on your history, your chest pain after eating is likely  │
│   related to your GERD condition. Your doctor prescribed          │
│   Omeprazole (20mg) for this — which is a proton pump inhibitor  │
│   that reduces stomach acid. The chest pain you're describing    │
│   sounds like it could be gastroesophageal reflux, which can     │
│   mimic cardiac chest pain...                                    │
│                                                                  │
│   However, given your hypertension history, it's important to    │
│   distinguish between GERD-related and cardiac chest pain...     │
│                                                                  │
│   ⚕️ Please consult your doctor if..."                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## The Key Insight: Tools Are the Bridge

```
┌─────────────────────────────────────────────────────────────────┐
│                         LLM AGENT                               │
│                    (the orchestrator/combiner)                   │
│                                                                 │
│  The agent decides WHICH tools to call based on the query.      │
│  It receives ALL results into its context window and            │
│  synthesizes a unified, personalized response.                  │
│                                                                 │
│  This is fundamentally different from a static pipeline where   │
│  you manually combine SQL results + vector results in code.     │
│  The LLM does the intelligent combination.                      │
└──────────┬──────────┬──────────┬──────────┬─────────────────────┘
           │          │          │          │
     ┌─────▼────┐ ┌───▼────┐ ┌──▼───┐ ┌───▼──────────┐
     │ Tool 1   │ │ Tool 2 │ │Tool 3│ │ Tool 4       │
     │ Pinecone │ │ Rx DB  │ │Profile│ │ Knowledge DB │
     │ (vector) │ │ (PG)   │ │ (PG) │ │ (PG + vector)│
     └──────────┘ └────────┘ └──────┘ └──────────────┘
```

The agent doesn't call ALL tools every time. It's smart enough to:
- Simple question ("what is diabetes?") → only calls `search_medical_knowledge` (Pinecone)
- Prescription question ("is my medication safe?") → calls `get_prescription_history` + `search_medical_knowledge`
- Complex question (example above) → calls 3-4 tools and combines

---

## What's Missing: The Knowledge Base Search Tool

Your current tools cover Pinecone (vector), prescriptions (PG), and medical profiles (PG). 
But you need one more tool to search the `KnowledgeEntry` table in PostgreSQL — 
this is where web search results, file explorations, and admin-added content live.

This tool uses **PostgreSQL full-text search** (not vector search), which is ideal for 
exact keyword matches on structured knowledge entries.

---

## Dual-Write Strategy for Knowledge Entries

When new knowledge enters the system (from web search, file upload, or admin), 
it gets stored in **both** PostgreSQL and Pinecone:

```
New Knowledge (e.g., web search result about "Omeprazole side effects")
         │
         ├──► PostgreSQL (knowledge_entries table)
         │    - Full text stored
         │    - Metadata (source URL, department, tags)
         │    - Searchable via full-text search + exact filters
         │
         └──► Pinecone (vector embedding)
              - Semantic embedding of the content
              - Metadata: { department, source, knowledgeEntryId }
              - Searchable via similarity/semantic search
```

**Why both?**
- **Pinecone** finds semantically similar content ("heart problems" matches "cardiac issues")
- **PostgreSQL** finds exact matches and allows filtering by department, source, verification status
- The agent can use either or both depending on the query

