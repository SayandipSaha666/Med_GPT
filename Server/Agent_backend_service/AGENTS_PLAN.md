# Multi-Agent Medical Assistant Architecture

## Overview

This document outlines the implementation plan for transforming Med_GPT from a RAG-based medical assistant into a full-featured **multi-agent AI medical system** with specialized departments, prescription analysis, web search, and appointment booking.

---

## Current State Assessment

### What Exists
- **RAG Pipeline**: FastAPI service with Groq LLM (120B), Pinecone vector store, HuggingFace embeddings
- **Backend**: Node.js/Express with PostgreSQL, Prisma ORM
- **Frontend**: React/Vite with Tailwind CSS
- **Auth**: JWT-based authentication with user sessions
- **Payment**: Razorpay integration for subscription plans

### Current Limitations
- Single generic LLM response without department specialization
- No prescription upload/analysis capability
- No web search integration
- No appointment booking system
- No multi-agent handoff architecture

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              User Interface                                  │
│                  (React Frontend - Chat/Upload/Book)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Gateway Agent (Router)                             │
│                  • LLM-based intent classification                          │
│                  • Department routing (Gynacology, Dental, etc.)            │
│                  • Query rewriting for specialization                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                         │
           ┌─────────────────────────────┼─────────────────────────────┐
           ▼                             ▼                             ▼
┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│   General Agent     │       │  Department Agents  │       │ Specialized Agents  │
│   (OPD/Triage)      │       │  - Gynacology       │       │  - Prescription     │
│   - General queries │       │  - Dental           │       │    Analyzer         │
│   - Triage          │       │  - Cardiac          │       │    - OCR extraction │
│   - RAG fallback    │       │  - ENT              │       │    - Medical sug.   │
└─────────────────────┘       │  - Dermatology      │       │  - Web Search       │
                              │  - Orthopedic       │       │    - Browser tools  │
                              └─────────────────────┘       │  - File Navigation  │
                                                            └─────────────────────┘
                                                                    │
                                                                    ▼
                                                  ┌─────────────────────────────┐
                                                  │   Booking & Reminder Agent│
                                                  │   - MCP servers             │
                                                  │   - Google Calendar sync    │
                                                  │   - Gmail/Message alerts    │
                                                  └─────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Multi-Agent Framework (Weeks 1-2)

#### 1.1 Agent System Architecture

**Goal**: Create the foundational agent system with handoff capabilities.

**Components**:
- `agent/` directory structure in Python services
- `AgentBase` abstract base class
- `AgentRegistry` for managing agents
- `AgentRouter` for intent classification and routing

**Files to Create**:
```
Server/services/agent/
├── __init__.py
├── base.py              # AgentBase abstract class
├── registry.py          # AgentRegistry for agent management
├── router.py            # Intent classifier and router
├── types.py             # Agent types, states, messages
└── conversation.py      # Multi-turn agent interactions
```

**Key Features**:
- `execute(query, context)` method for each agent
- `can_handle(query)` method for intent detection
- Handoff protocol with context preservation
- Conversation history tracking

---

#### 1.2 Gateway Agent (System 1 Decision Maker)

**Goal**: Implement the primary decision-making layer.

**Model**: Use lightweight, fast model for routing:
- **Options**: `llama-3.3-70b`, `gpt-oss-120b` (already available), or `claude-3.5-haiku`
- **Approach**: Few-shot classification + function calling

**Intent Categories**:
1. `general_medical` → General Agent
2. `gynacology` → Department Agent (Gynacology)
3. `dental` → Department Agent (Dental)
4. `cardiac` → Department Agent (Cardiac)
5. `prescription_upload` → Prescription Analyzer Agent
6. `appointment_booking` → Booking Agent
7. `web_search` → Web Search Agent
8. `fallback` → RAG fallback

**Implementation**:
```python
# agent/router.py
class AgentRouter:
    def classify_intent(self, query: str) -> str:
        """Classify query intent using LLM"""
        pass
    
    def route(self, query: str, user_id: int) -> AgentResponse:
        """Route query to appropriate agent"""
        pass
```

---

### Phase 2: Department & Specialized Agents (Weeks 3-4)

#### 2.1 Department Agents

**Goal**: Create specialized agents for medical departments.

**Agents to Implement**:
1. **Gynacology Agent**
2. **Dental Agent**
3. **Cardiac Agent**
4. **ENT Agent**
5. **Dermatology Agent**
6. **Orthopedic Agent**

**Structure** (per agent):
```
Server/services/agent/departments/
├── __init__.py
├── base.py              # DepartmentAgent base
├── gynacology.py
├── dental.py
├── cardiac.py
├── ent.py
├── dermatology.py
└── orthopedic.py
```

**Agent Features**:
- Department-specific RAG retriever (or share vector store with filters)
- Department-specific prompts
- Knowledge base filtering
- Confidence scoring

---

#### 2.2 Prescription Analyzer Agent

**Goal**: Extract text from prescriptions and provide medical suggestions.

**Technology Stack**:
- **OCR**: `pytesseract` + `pillow` or `google-generativeai` (Vision API)
- **Document Processing**: `pdfplumber` or `pdf2image`
- **Extraction**: LLM-based structured extraction

**Implementation Steps**:
1. Upload endpoint (`POST /api/analyze-prescription`)
2. Image/PDF processing pipeline
3. OCR text extraction
4. LLM-based structured data extraction:
   - Medication names
   - Dosage instructions
   - Frequency
   - Duration
5. Medical suggestions based on extracted data

**Data Structure**:
```python
class PrescriptionAnalysis(BaseModel):
    medications: List[Medication]
    overall_assessment: str
    warnings: List[str]
    recommendations: List[str]

class Medication(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str
```

---

#### 2.3 Web Search Agent

**Goal**: Enable agents to search the web for current information.

**Tools**:
- **Search**: Google Search API or SerpAPI
- **Content Extraction**: `readabilipy` or `markdownify`
- **Caching**: Redis for search results

**Integration Pattern**:
```python
class WebSearchAgent:
    def search(self, query: str, k: int = 5) -> List[SearchResult]:
        pass
    
    def retrieve_page(self, url: str) -> str:
        """Extract readable content from URL"""
        pass
    
    def search_and_analyze(self, query: str, analysis_prompt: str) -> str:
        """Search, retrieve, then analyze with LLM"""
        pass
```

**Use Cases**:
- Current medication warnings
- Latest medical guidelines
- Hospital information
- Symptom verification

---

#### 2.4 File Navigation Agent

**Goal**: Help agents navigate and use local/remote files.

**Capabilities**:
- Read medical documentation files
- Parse structured medical data
- Search knowledge base files
- Extract information from PDF/DOCX

**Implementation**:
```python
class FileNavigationAgent:
    def read_file(self, path: str) -> str:
        pass
    
    def search_in_files(self, query: str, file_patterns: List[str]) -> List[Match]:
        pass
    
    def extract_from_document(self, doc_path: str, extraction_prompt: str) -> Any:
        pass
```

---

### Phase 3: Booking & Reminder System (Weeks 5-6)

#### 3.1 Appointment Booking Agent

**Goal**: Book appointments to nearest hospitals.

**Integration Points**:
- **Hospitals Database**: REST API or scraped data
- **MCP Servers**: Model Context Protocol for external services
- **Booking Engine**: Simple availability matching

**Architecture**:
```
Server/services/booking/
├── __init__.py
├── agent.py             # BookingAgent class
├── hospital_api.py      # Hospital data integration
├── availability.py      # Availability checking
├── models.py            # Booking domain models
└── calendar_sync.py     # Google Calendar integration
```

**Booking Flow**:
1. User request: "Book a cardiology appointment near me"
2. Extract: Speciality, location, preferred date
3. Search: Hospitals with available slots
4. Present: Top 3 options with details
5. Confirm: User selects and books
6. Sync: Add to Google Calendar

---

#### 3.2 Google Calendar & Gmail Integration

**Goal**: Sync appointments and send reminders.

**APIs**:
- **Google Calendar API**: Create/remove events
- **Gmail API**: Send appointment confirmations
- **OAuth 2.0**: User authorization flow

**Implementation**:
```python
# agent/calendar_sync.py
class GoogleCalendarSync:
    def __init__(self, credentials_path: str):
        self.service = build("calendar", "v3", credentials=credentials)
    
    def add_event(self, user_id: int, appointment: Appointment) -> str:
        """Create event and return event ID"""
        pass
    
    def send_reminder(self, user_email: str, appointment: Appointment):
        """Send email reminder"""
        pass
```

**Reminder Strategy**:
- **Pre-appointment**: 24 hours before
- **Same-day**: 2 hours before
- **Post-appointment**: Follow-up survey

---

#### 3.3 SMS/WhatsApp Integration

**Goal**: Send appointment reminders via SMS/WhatsApp.

**Options**:
- **Twilio API**: SMS and WhatsApp
- **MessageBird**: Alternative SMS provider
- **Meta WhatsApp Business API**: For WhatsApp messages

**Implementation**:
```python
class SMSReminder:
    def send_appointment_reminder(self, phone: str, appointment: Appointment):
        pass
    
    def send_prescription_reminder(self, phone: str, medications: List[Medication]):
        pass
```

---

### Phase 4: Enhancement & Optimization (Weeks 7-8)

#### 4.1 Confidence Scoring & Uncertainty Handling

**Goal**: Agent knows when it's unsure.

**Implementation**:
```python
class ConfidenceScorer:
    def score(self, query: str, response: str, sources: List[Source]) -> float:
        """Calculate confidence score 0-1"""
        pass
    
    def should_fallback(self, score: float, threshold: float = 0.7) -> bool:
        pass
```

**Fallback Strategies**:
- RAG fallback when confidence low
- Human escalation for critical queries
- "I'm not sure" with suggestion to consult doctor

---

#### 4.2 Conversation Memory & Context

**Goal**: Agents remember context across turns.

**Implementation**:
```python
class ConversationMemory:
    def __init__(self, chat_id: int):
        self.chat_id = chat_id
    
    def get_context(self, window: int = 10) -> List[Message]:
        """Get recent conversation history"""
        pass
    
    def update(self, role: str, content: str, metadata: Dict = None):
        """Add new message to history"""
        pass
```

---

#### 4.3 Agent Collaboration

**Goal**: Multiple agents working together on complex queries.

**Example Flow**:
```
User: "I have chest pain and my doctor prescribed Aspirin. 
       Should I continue?"

1. General Agent → Cardiac Agent (specialized analysis)
2. Cardiac Agent → Web Search Agent (latest guidelines)
3. Cardiac Agent → Prescription Analyzer (medication review)
4. Results aggregated → User response
```

**Implementation**:
```python
class AgentCollaborator:
    def orchestrate(self, query: str, agents: List[Agent]) -> Response:
        """Orchestrate multiple agents"""
        pass
    
    def aggregate_responses(self, responses: List[AgentResponse]) -> str:
        """Combine agent responses coherently"""
        pass
```

---

## Suggested Technologies

### AI/ML
| Component | Recommended Model | Reason |
|-----------|-------------------|--------|
| Routing/Decision | `llama-3.3-70b` or `gpt-oss-120b` | Fast, accurate classification |
| Department Agents | `gpt-oss-120b` | Already configured, powerful |
| Prescription OCR | `gemini-1.5-flash` | Excellent vision model |
| Web Search Analysis | `claude-3.5-haiku` | Fast, good reasoning |

### Infrastructure
| Component | Technology | Purpose |
|-----------|------------|---------|
| Vector Store | Pinecone | Already in use |
| Database | PostgreSQL | Already in use |
| Cache | Redis | Search results, embeddings |
| Task Queue | Celery | Background jobs (OCR, email) |

### APIs & Services
| Service | Provider | Purpose |
|---------|----------|---------|
| Google APIs | Google Cloud | Calendar, Gmail |
| OCR | Google Gemini / Tesseract | Prescription scanning |
| Search | SerpAPI / Google Custom Search | Web search |
| SMS | Twilio | Appointment reminders |

---

## Priority Implementation Order

### Week 1-2: Foundation
1. Agent base classes and registry
2. Intent classifier router
3. General Agent (enhanced existing RAG)
4. Agent conversation context

### Week 3-4: Specialization
5. Department agents (3-4 departments)
6. Prescription Analyzer Agent (OCR + analysis)
7. Web Search Agent

### Week 5-6: Booking & Integration
8. Booking Agent
9. Google Calendar sync
10. Reminder system

### Week 7-8: Polish
11. Confidence scoring
12. Agent collaboration
13. Testing and optimization

---

## Key Design Patterns

### 1. Agent Protocol
```python
@dataclass
class AgentMessage:
    role: str  # 'user', 'agent', 'system'
    content: str
    metadata: Dict = None

@dataclass
class AgentResponse:
    content: str
    agent_type: str
    confidence: float
    sources: List[Dict] = None
    handoff_to: str = None  # If routing to another agent
```

### 2. Handoff Protocol
```python
# When Agent A can't handle, it hands off:
return AgentResponse(
    content="I'll connect you with a dental specialist...",
    handoff_to="DentalAgent",
    metadata={"preserved_context": original_query}
)
```

### 3. Safety Gate
```python
# All responses go through safety filter before user:
class SafetyFilter:
    def filter(self, content: str) -> Tuple[bool, str]:
        """Check for harmful/unsafe content"""
        pass
```

---

## Next Steps

1. **Review this plan** and approve the architecture
2. **Set up agent directory structure**
3. **Implement AgentBase and registry**
4. **Create Intent Router with few-shot examples**
5. **Build first Department Agent (e.g., Dental)**
6. **Implement Prescription Analyzer**
7. **Add Web Search integration**
8. **Build Booking system with Calendar sync**

---

## Notes & Considerations

### Medical Safety
- **Always include disclaimer** in responses
- **No diagnosis** - only information and suggestions
- **Escalate critical symptoms** (chest pain, severe bleeding, etc.)
- **Maintain medical error boundaries**

### Performance
- Cache frequent queries
- Parallel agent execution when possible
- Stream responses for better UX

### Cost Management
- Use smaller models for routing
- Implement result caching
- Batch similar requests

---

*This plan will be updated as implementation progresses and new requirements emerge.*
