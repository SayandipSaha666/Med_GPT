# Frontend implementation notes

Based on `MedGPT_Frontend_Experience_Spec.md` and source inspection on 2026-11-06.

## Dependency map

| Flow | Frontend | API and service | Data and ownership |
| --- | --- | --- | --- |
| New conversation | `Chatbox.tsx`, `Sidebar.tsx`, `chats.service.ts` | `POST /api/chat/create`, `chatController.createChat`, `chatService.createChat` | Prisma `Chat` belongs to `User` through `userId`. |
| Message and stream | `PromptInput.tsx` → `ChatDetails.tsx` → `chats.service.ts` → `Message.tsx` | `POST /api/chat/:id/tasks` returns `{taskId,userMessage,assistantMessage}`; `GET /api/chat/:id/tasks/:taskId/stream` emits `update` and `end` SSE events with status, progressMessage, agentType, content; cancel is `POST /api/chat/:id/tasks/:taskId/cancel`. `messageController`, `messageService.enqueueMessage`, and `Agent_backend_service/worker.ts` persist the task and assistant text. | Prisma `Message` belongs to `Chat`, `AgentTask` links user and assistant messages. Chat ownership is checked before enqueue; stream and cancel filter by chatId and userId. |
| History | `Sidebar.tsx`, `ChatDetails.tsx`, `chats.service.ts` | `GET /api/chat/all` returns chat summaries with latest message; `GET /api/chat/:id` returns chat with ordered messages from `chatService.getChatById`. | `chatRepository.findByUserId` filters by userId; detail checks `chat.userId`. |
| File upload | `FileUpload.tsx`, `useChatAttachments.ts`, `files.service.ts` | `POST /api/files` multipart file, `GET /api/files/:id`, `GET /api/files`, `DELETE /api/files/:id`; allowed types are txt, PDF, DOC/DOCX, PNG/JPEG/GIF/WebP; default maximum 10 MB. | Prisma `File.userId` owns the record and `messageId` optionally associates it to a message. Upload returns PROCESSING; processing later sets READY/FAILED. Message enqueue associates supplied `fileIds` after verifying user ownership. `message.mapper.ts` returns associated file DTOs when history loads. |
| Search and sources | `Message.tsx`, `SourceList.tsx` | `Message` DTO and mapper expose `sources?: Source[]` as a web or file source with 1-based citation index. Prisma `Message.sources` is JSON. | **NOT IMPLEMENTED in the active pipeline:** `Agent_backend_service/worker.ts` does not write source records, and `streamAgentPipeline` currently does not provide normalized source cards. The non-streaming pipeline returns an empty sources array. The UI renders actual DTO sources if supplied, but cannot show historical web sources until the backend populates them. |
| Auth | `ProtectedRoute.tsx`, `authStore.tsx`, `api/index.ts` | Axios bearer token and refresh flow; protected chat and file routes use auth middleware. | Server userId and ownership checks are the security boundary; sidebar filtering is presentation only. |

## Implemented frontend

1. Defined message-source and file-status types in `Client/src/api/api.types.ts`.
2. Added the light and dark conversation visual system in `Client/src/workspace.css` and rebuilt the shell, composer, message, and empty states while preserving existing API calls and controls.
3. Kept persisted files with their messages, exposed upload processing and retry states, and rendered only real `sources` values with safe links and citation anchors.
4. Validated TypeScript, lint, production build, and desktop/mobile rendered states. Backend source persistence remains a separate follow-up.

## Separate backend proposal for historical sources

The schema already has `Message.sources` JSON and the chat detail serializer exposes it, so no database migration is needed for the minimum compatible change. Normalize the search tool's final results into the existing source DTO shape (including a stable 1-based citation index and the returned URL), persist that array on the corresponding assistant message when its task completes, and include it in the existing `GET /api/chat/:id` response. Optionally add `sources` to the existing task stream's final event for immediate display; refetching the persisted message after stream completion also works with the current frontend. Keep URL validation and authorization on the server, and test that reopening a chat returns the same source set. This proposal is not implemented in the frontend change set.
