# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary audience is patients and caregivers seeking understandable health information. They may attach reports or scans when asking a question.

## Product Purpose

MedGPT provides conversational medical information with persistent chats, document attachments, and AI-generated responses. Success means a user can ask a question, understand the answer and its uncertainty, and revisit the conversation and its associated files.

## Operating Context

Users may ask about symptoms, medications, lab results, and general wellness. They can upload supported documents and images into a chat. Some responses are generated through an asynchronous agent task and streamed into the conversation.

## Capabilities and Constraints

- Existing React, Vite, and TypeScript client; Express and Prisma services provide authenticated chat, message, and file APIs.
- Persisted messages and attached files are returned by chat detail. File processing has PROCESSING, READY, and FAILED states.
- A source field exists on messages, but the current generation pipeline does not populate it. Source attribution must only appear when actual source data is returned.
- MedGPT provides information, not a confirmed diagnosis or replacement for professional medical care.

## Brand Commitments

- Preserve the MedGPT name and recognizable product identity.
- The requested conversation design takes inspiration from the clarity and source hierarchy of Perplexity without copying its branding or exact styling.

## Evidence on Hand

- Product requirements: `spec/MedGPT_Frontend_Experience_Spec.md`.
- Current contracts and behavior: `Client/src`, `Server/user_service/src`, `Server/user_service/prisma/schema.prisma`, and `Server/Agent_backend_service/worker.ts`.
- No approved medical claims, testimonials, or source classifications were supplied.

## Product Principles

- Keep the conversation and its evidence easy to read.
- Separate generated information from external sources and attached files.
- Preserve uncertainty and medical safety language.
- Show only states and capabilities the backend actually supports.

## Accessibility & Inclusion

The specification targets practical WCAG 2.2 AA support, including keyboard navigation, visible focus, contrast, responsive layouts, and reduced motion.
