# MedGPT Frontend Experience — Product & Engineering Specification

**Document type:** Implementation specification  
**Product:** MedGPT  
**Target implementation:** Existing React + Vite + TypeScript application  
**Design direction:** Research-oriented conversational AI, inspired by the clarity and information hierarchy of Perplexity-style chat interfaces  
**Status:** Discovery required before implementation

---

## 1. Objective

Redesign and refine MedGPT's frontend into a polished conversational medical-assistance workspace.

The experience should feel like a modern AI research application rather than a generic admin dashboard or a direct copy of ChatGPT/Perplexity. It should prioritize:

1. A focused chat experience.
2. Readable, well-structured assistant responses.
3. Clear visibility of web-search activity and cited sources.
4. Clear visibility of files attached to a conversation and files used by the assistant.
5. Persistent conversations and their associated messages, files, and source links.
6. Responsive, accessible interactions.
7. Medical-context safety: the interface must not visually imply that generated content is a confirmed diagnosis or a substitute for a clinician.

This document is a specification, not permission to replace backend behavior or invent APIs. The implementation agent must inspect the repository and use the real contracts.

## 2. Mandatory repository discovery before implementation

Use the installed **Graphify skill** (if available in the Codex environment) to map the repository and trace dependencies. Also inspect the code directly; do not treat a generated graph as the sole source of truth.

### 2.1 Inspect the actual stack and entry points

Identify and record:

- Frontend entry point, router, layouts, pages, and route guards.
- Existing chat page, message list, composer, attachment picker, and conversation sidebar.
- API client, query/cache layer, auth/session handling, and error handling.
- Streaming implementation (SSE, WebSocket, fetch streaming, or other).
- Backend routes, controllers, services, and response serializers used by chat.
- Prisma schema and migrations for users, chats, messages, files, transactions/plans, and any source/search records.
- File upload, storage, processing, and download flows.
- Web-search tool invocation and the exact shape of its results.
- Any MCP/tool-call event format surfaced to the frontend.
- Existing design tokens, component library, icon library, and styling conventions.
- Tests, lint scripts, type-check scripts, and build commands.

### 2.2 Required Graphify traversal

Use Graphify to trace these flows end to end:

**A. Chat send and response**
`Composer → frontend handler → API client → backend route → controller/service/agent → persistence → response/stream → message renderer`

**B. File attachment**
`File picker/dropzone → upload endpoint → storage/provider → File database record → processing status → chat/message association → rendered attachment`

**C. Web search and sources**
`User query → search intent/tool → search provider → normalized result → persistence (if implemented) → assistant response/citations → source UI`

**D. Conversation history**
`Chat list request → database query → sidebar → open conversation → messages and related artifacts`

**E. Authentication and authorization**
`Session/JWT → protected route → API request → ownership checks → chat/file access`

For each flow, list the real file paths, exported functions, API routes, request/response types, database models, and ownership rules. Include a compact dependency map in the implementation notes.

### 2.3 Discovery output

Before changing code, create or update an implementation note containing:

- Actual files involved.
- Actual API endpoints and HTTP methods.
- Actual request/response payloads.
- Actual Prisma model and relation names.
- Whether sources are persisted separately, embedded in message JSON, or only returned transiently.
- Whether uploaded files are associated with a chat, a message, or both.
- How processing status is represented.
- What is currently missing from the backend for the requested UI.

If a capability does not exist, mark it **NOT IMPLEMENTED**. Do not fabricate a route, database field, model, event, or response property.

---

## 3. Product experience and information architecture

### 3.1 Primary application shell

Use a restrained, high-quality workspace layout:

- **Left sidebar:** product identity, new chat action, conversation history, search/filter for conversations if supported, account/settings entry.
- **Main conversation area:** messages, research/source context, and composer.
- **Optional contextual panel:** source details or attached-file details on wider screens, only when useful. On small screens, use a drawer/sheet.
- **Top bar:** current conversation title or new-chat context, relevant actions, and account controls.

The sidebar should be collapsible. On mobile, it should become an accessible navigation drawer. Avoid forcing a three-column layout on narrow screens.

### 3.2 New conversation / empty state

The empty state should:

- Clearly identify MedGPT.
- Explain briefly what the assistant can help with, without making clinical promises.
- Present a prominent composer.
- Offer a small number of useful example prompts, only if they map to supported capabilities.
- Allow file attachment if the existing upload flow supports it.
- Avoid a crowded dashboard of cards.

### 3.3 Conversation state

A conversation view must support:

- User and assistant messages.
- Streaming/typing state if the backend streams.
- Error and retry state where retry is supported.
- Copy response.
- Regenerate response only if supported by the backend.
- Message timestamps only where useful.
- Markdown rendering with safe link handling.
- Code/table/list formatting where relevant.
- Clear medical disclaimers in the appropriate context, using existing backend-provided text or approved product copy.

Do not render tool/debug traces as ordinary assistant prose. If tool activity is available, show it as a compact, understandable activity state.

---

## 4. Visual design direction

### 4.1 Reference principles

Use Perplexity-style research UX as a reference for:

- Strong focus on the conversation.
- Calm typography and generous readable line length.
- Visible sources and citations near the answer they support.
- Compact research activity indicators.
- Minimal navigation chrome.
- Clear distinction between generated answer content and external evidence.

Do not copy its logo, exact layout, proprietary assets, or exact visual styling. MedGPT should have its own medical-product identity.

### 4.2 Visual qualities

Target a calm, credible, contemporary interface:

- Neutral surface palette with one restrained brand accent.
- Strong text contrast and readable typography.
- Consistent spacing scale and component radii.
- Subtle borders and elevation; avoid excessive shadows.
- Minimal gradients and decorative effects.
- Clear hover, focus, active, disabled, loading, and error states.
- Responsive content width; avoid very wide text blocks.
- Use icons consistently from the project's existing icon library.

Use Impeccable for design critique and visual refinement. Use Taste/design-taste-frontend for visual direction where appropriate. Do not allow a skill to override established project constraints without review.

### 4.3 Design tokens

Inspect existing tokens first. Reuse and consolidate them rather than introducing a parallel design system.

Define or document tokens for:

- Background and surface levels.
- Primary, secondary, muted, and inverse text.
- Brand accent and semantic states.
- Border colors.
- Typography families, sizes, weights, and line heights.
- Spacing scale.
- Radius scale.
- Elevation/shadows.
- Focus ring.
- Responsive breakpoints.

Support the existing theme mode(s). Do not introduce a new theme mode unless the application already supports it or the product owner approves it.

---

## 5. Chat composer specification

The composer is the primary interaction surface.

### Required behavior

- Multiline text input that grows to a sensible maximum height.
- Submit using the existing chat API contract.
- Enter/Shift+Enter behavior must be deliberate and accessible.
- Disable duplicate submission while a request is in progress, unless the current product supports concurrent requests.
- Show clear sending/streaming/error states.
- Preserve unsent text when an API request fails.
- Support keyboard focus and visible focus styling.
- Avoid sending whitespace-only messages.

### Attachments

If the existing backend supports attachments:

- Provide an attachment button and drag-and-drop affordance.
- Display selected files before submission.
- Show filename, file type, size where available, upload/progress state, and remove action before send.
- Validate against the backend's actual allowed MIME types and size limits.
- Show upload failures in context with a retry/remove action.
- Do not claim a file has been uploaded or processed until the backend confirms it.
- Do not expose private storage URLs or credentials.

Do not assume that every uploaded file is automatically part of a message. Trace the real association model and preserve the existing contract.

---

## 6. Message attachments and file visibility

MedGPT stores file records and exposes files/links to the application. The UI must make the relationship between a conversation, a message, and a file understandable.

### 6.1 Attachment presentation

Render attachments as compact, accessible file rows/cards containing only metadata actually returned by the backend, such as:

- File name.
- File type/extension.
- File size, if available.
- Processing status, if available.
- Upload/creation time, if available.
- Safe download/open action, if a valid authorized URL or endpoint is provided.

Use the actual file status enum and status transitions found in the schema/backend. A known project model has previously used `PROCESSING`, `READY`, and `FAILED`; verify the current schema before relying on these exact values.

### 6.2 File states

Represent backend states clearly:

- Uploading: client-side progress, if available.
- Processing: explain that the file is being prepared.
- Ready: show the available open/download action.
- Failed: show a concise failure state and retry option only if the backend supports retry.
- Missing/expired/unavailable: show a recoverable error without exposing internal storage details.

Never infer successful processing from upload success alone.

### 6.3 Files associated with prior messages

When loading an existing conversation, fetch/render files using the existing conversation/message response or the established file API. Do not rely only on local component state.

The user should be able to distinguish:

- Files attached by the user.
- Files returned/generated by the assistant, if supported.
- Files used as context for a particular answer, if that relationship is represented by the backend.

Do not show unrelated files belonging to another chat or user.

---

## 7. Web search, citations, links, and research sources

This is a core product requirement.

When web search is activated and the backend returns search results, the frontend must display those results in context rather than silently discarding them or flattening them into plain text.

### 7.1 Search activity

If the backend exposes search/tool lifecycle events, show a compact activity indicator, for example:

- Searching the web…
- Reviewing sources…
- Preparing the response…

Use actual event names and statuses. If the backend returns only a final response, do not invent a live progress timeline.

### 7.2 Sources presentation

When sources are returned, render a dedicated **Sources** section associated with the relevant assistant message.

Each source may display, when available:

- Source title.
- Domain or publisher.
- Short snippet.
- Favicon or source icon, if safely available.
- Canonical URL.
- Open-in-new-tab action with safe link attributes.

Requirements:

- Preserve the exact source URL returned by the backend after validation.
- Use safe external-link handling (`target="_blank"` with `rel="noopener noreferrer"` where applicable).
- Do not fabricate titles, publishers, snippets, citations, or source counts.
- Do not label a source as medically authoritative unless the backend or trusted metadata explicitly supports that classification.
- Make citations in the answer navigable to their corresponding source cards when the response format supports citation references.
- Avoid duplicating the same source repeatedly within one message; deduplicate only using a stable identifier or canonical URL rule that is compatible with the backend data.

### 7.3 Persistence and historical rendering

Inspect how search results are stored.

- If sources are persisted, load them when reopening the conversation and render the same source set for the associated assistant message.
- If sources are embedded in message metadata/JSON, use the established serializer/type.
- If sources are only transient, document that limitation. Do not pretend they are persistent.
- If product requirements demand historical source display but the backend does not persist sources, propose a backend change separately with a migration/API design. Do not silently introduce frontend-only persistence.

### 7.4 Link types

Differentiate:

- External web-search source links.
- Links included in assistant-generated content.
- Internal MedGPT routes.
- Authorized file links.

Do not treat every URL as a web-search citation.

---

## 8. Assistant response rendering

Create a readable response renderer that supports the actual output format:

- Paragraphs and headings.
- Ordered and unordered lists.
- Tables with horizontal overflow on small screens.
- Inline code and code blocks.
- Links.
- Citation markers/source references, if returned.
- Structured tool output only where intended for users.

Use a safe Markdown renderer and sanitize or constrain raw HTML. Do not render arbitrary HTML from model output.

For medical content:

- Keep uncertainty and disclaimers visible when provided.
- Do not style speculative content as confirmed fact.
- Do not visually imply diagnosis, prescription, or clinical approval.
- Emergency guidance, if returned by the backend, should remain prominent and accessible.
- Do not rewrite or suppress safety language in order to improve visual aesthetics.

---

## 9. Conversation sidebar and history

Use the existing chat persistence contract.

- Load the authenticated user's conversations.
- Show conversation titles and useful timestamps if available.
- Highlight the active conversation.
- Support creating a new chat.
- Support opening existing chats.
- Support rename/delete only if the backend supports those operations.
- Provide loading, empty, and error states.
- Keep the sidebar responsive and keyboard accessible.
- Ensure ownership and authorization are enforced by the backend; frontend filtering is not a security boundary.

If conversation search is not implemented, do not present a nonfunctional search control.

---

## 10. Data contracts and frontend architecture

Before implementation, define TypeScript types from the real backend DTOs or shared schemas.

At minimum, map the actual equivalents of:

- Conversation/Chat.
- Message.
- File/Attachment.
- SearchSource/Citation.
- Tool activity/event.
- Streaming event.
- API error.

Do not assume these exact names exist in the codebase.

### Data handling rules

- Keep server state in the project's existing query/cache solution.
- Keep ephemeral composer/UI state local or in the existing state layer.
- Avoid duplicating server records in multiple stores.
- Invalidate/update relevant queries after mutations.
- Handle stale, loading, empty, and error states.
- Avoid N+1 requests where the existing API can return related data.
- Use stable IDs as React keys.
- Do not use array indices for persistent message/source/file identity.
- Do not store authentication tokens or private file URLs in local storage unless the existing security design explicitly requires it.

### Suggested component boundaries

Adapt these to the existing codebase; do not create duplicate components if equivalents already exist.

- `AppShell`
- `ConversationSidebar`
- `ConversationHeader`
- `ConversationView`
- `MessageList`
- `UserMessage`
- `AssistantMessage`
- `AssistantResponseRenderer`
- `SourceList`
- `SourceCard`
- `SearchActivity`
- `AttachmentList`
- `AttachmentItem`
- `ChatComposer`
- `FilePicker`
- `EmptyConversationState`
- `MessageActions`
- `ResponsiveSidebarDrawer`

---

## 11. Motion and interaction

Use Emil Kowalski's relevant skills for purposeful motion.

Appropriate examples:

- Sidebar open/close.
- Composer focus and expansion.
- Attachment insertion/removal.
- Source section expand/collapse.
- Message appearance during streaming.
- Dialog and drawer transitions.
- Button feedback.

Rules:

- Motion must communicate state or hierarchy.
- Prefer performant transform/opacity animations.
- Keep timing restrained and consistent.
- Avoid animating large blocks on every token/stream chunk.
- Respect `prefers-reduced-motion`.
- Do not delay critical actions for decorative animation.

Use `review-animations` or equivalent for a focused motion review.

---

## 12. Accessibility and responsive requirements

Target WCAG 2.2 AA where practical.

Verify:

- Semantic landmarks and heading order.
- Keyboard-only navigation.
- Visible focus indicators.
- Accessible names for icon-only buttons.
- Appropriate dialog/drawer focus management.
- Screen-reader announcements for send/upload/error/streaming state without excessive announcements.
- Sufficient contrast.
- Reduced-motion support.
- Responsive layouts at narrow mobile, tablet, laptop, and wide desktop sizes.
- No horizontal page overflow.
- Tables and source lists remain usable on mobile.

Do not rely on color alone to communicate status.

---

## 13. Security, privacy, and medical-product considerations

- Enforce chat and file ownership on the server.
- Do not expose internal storage credentials or unrestricted storage paths.
- Do not trust client-supplied user IDs or file ownership metadata.
- Validate external URLs before rendering clickable links.
- Sanitize Markdown/HTML and prevent script injection.
- Avoid leaking private patient or user data into logs, analytics, or URLs.
- Do not show sensitive file contents in previews unless the existing product flow authorizes it.
- Preserve backend guardrails and medical disclaimers.
- Make it clear that MedGPT provides informational assistance and is not a replacement for professional medical care, using approved product wording.

---

## 14. Testing and acceptance criteria

### Functional acceptance

- [ ] User can create a conversation using the existing API.
- [ ] User can send a message and see the correct response.
- [ ] Streaming behavior matches the actual backend protocol.
- [ ] Existing conversations load with their messages.
- [ ] Files attached to a conversation/message are displayed from persisted data.
- [ ] File status is rendered from backend state.
- [ ] Authorized file open/download actions work.
- [ ] Web-search activity is shown when actual search events are exposed.
- [ ] Returned sources are displayed with correct titles/URLs/snippets.
- [ ] Historical sources reappear after reopening a conversation if the backend persists them.
- [ ] Sources are not fabricated when none are returned.
- [ ] API failures, upload failures, and processing failures have useful UI states.
- [ ] No unrelated backend behavior is changed.

### Visual acceptance

- [ ] The UI has a coherent MedGPT visual identity.
- [ ] The conversation is the primary focus.
- [ ] Message typography is readable for long responses.
- [ ] Source cards are visually distinct from assistant prose.
- [ ] Attachments are easy to identify and interact with.
- [ ] Empty, loading, streaming, and error states are designed.
- [ ] The layout works at mobile, tablet, and desktop widths.
- [ ] No excessive gradients, card grids, or decorative motion.
- [ ] Dark/light themes work if both already exist.

### Engineering acceptance

- [ ] TypeScript check passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Relevant tests pass.
- [ ] Browser testing covers core chat, file, and source flows.
- [ ] No unauthorized API or database contract assumptions remain.
- [ ] Existing authentication and authorization behavior is preserved.

---

## 15. Required implementation workflow for Codex

1. **Discover:** Load relevant installed skills. Use Graphify to map the codebase and trace chat, file, source, and persistence flows.
2. **Report:** Summarize actual architecture, API contracts, database relations, and gaps before editing.
3. **Plan:** Propose a staged implementation plan with files likely to change. Separate frontend-only work from any required backend changes.
4. **Design:** Use Impeccable for UX/UI critique and Taste for visual direction where relevant. Define the MedGPT design system.
5. **Implement:** Build incrementally using existing components, APIs, types, and conventions.
6. **Integrate data:** Connect persisted messages, files, and sources to the correct conversation/message using real IDs and contracts.
7. **Animate:** Use Emil Kowalski's relevant skills for restrained, purposeful interactions.
8. **Validate:** Run the application and use Playwright/browser tooling to inspect actual rendered pages and exercise real flows.
9. **Review:** Run design, responsive, accessibility, motion, and code-quality reviews. Fix issues and re-test.
10. **Report:** Summarize files changed, behavior implemented, tests run, and any backend gaps that remain.

### Agent coordination

Use Ruflo only if the task is large enough to benefit from delegation. Suggested independent workstreams:

- Repository/API/data-flow audit.
- Design system and UI implementation.
- File/source rendering integration.
- Browser QA and accessibility review.

Avoid multiple agents editing the same files simultaneously. Assign one integration owner. Do not delegate implementation based on guessed API contracts.

---

## 16. Explicit non-goals

Unless repository inspection and product requirements justify them, do not:

- Replace the backend architecture.
- Rewrite authentication.
- Change database models or migrations as part of a visual redesign.
- Replace the existing state-management or API layer.
- Add a new UI framework.
- Add mock search results or fake file records.
- Add nonfunctional controls.
- Copy Perplexity branding or proprietary assets.
- Change medical safety behavior.
- Remove existing working functionality to simplify the UI.

If backend changes are necessary to persist sources or associate files correctly, document the exact gap and propose the smallest compatible API/schema change before implementing it.

---

## 17. Final deliverables

The implementation should produce:

1. A polished, responsive MedGPT conversational interface.
2. A consistent design system aligned with existing project conventions.
3. Persisted conversation history rendered from real data.
4. File attachments and processing states rendered from real persisted records.
5. Web-search sources and citations rendered from actual backend results.
6. Accessible interaction and error states.
7. Browser-tested core user flows.
8. A concise implementation report with changed files, tests, and remaining limitations.

**Guiding principle:** Make MedGPT feel like a trustworthy, focused medical research conversation workspace. Design quality matters, but correctness of persisted data, source attribution, file ownership, and medical safety matters more.
