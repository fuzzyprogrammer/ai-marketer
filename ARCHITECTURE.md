# Architecture

## Overview

AI Marketer is a self-hostable marketing automation platform that generates and publishes content across multiple social media channels using AI.

## Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │  Brand      │ │  Content    │ │  Calendar   │ │  Analytics │ │
│  │  Onboarding │ │  Library    │ │             │ │  Dashboard │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Server (Fastify)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │  Brands     │ │  Jobs       │ │  Content    │ │  Admin    │ │
│  │  Endpoints  │ │  Endpoints  │ │  Endpoints  │ │  Endpoints │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│                         │              │                         │
│                    ┌────┴────┐    ┌────┴────┐                   │
│                    │ Workers │    │  Queues │                   │
│                    └─────────┘    └─────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  Broker     │  │ Render      │  │  Poster     │
    │  (OmniRoute)│  │  Worker     │  │  Worker     │
    └─────────────┘  └─────────────┘  └─────────────┘
              │               │               │
              ▼               ▼               ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  Free Model │  │  Chromium   │  │  Twitter    │
    │  Providers  │  │  + FFmpeg   │  │  API        │
    └─────────────┘  └─────────────┘  └─────────────┘
```

## Data Flow

1. **Brand Ingestion**: User provides URL/files → Ingest Worker extracts profile → Stored in Postgres
2. **Content Generation**: Brand profile → Generator Worker calls Broker → AI generates content → Stored as drafts
3. **Content Rendering**: Approved content → Render Worker creates HTML composition → Puppeteer captures frames → FFmpeg encodes video
4. **Content Posting**: Scheduled posts → Poster Worker publishes to platforms via OAuth → Analytics tracked

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14, Tailwind CSS, shadcn/ui |
| API | Fastify, TypeScript |
| Broker | Express, TypeScript |
| Workers | Node.js, TypeScript |
| Database | PostgreSQL 15 |
| Cache/Queue | Redis 7 |
| Object Storage | MinIO (S3-compatible) |
| AI Models | OmniRoute (free-tier stacking) |
| Rendering | Puppeteer + FFmpeg |
| Containerization | Docker Compose |

## Storage Schema

### PostgreSQL Tables

- `brands` - Brand profiles and extracted information
- `jobs` - Task queue with status tracking
- `content_drafts` - Generated content awaiting approval
- `scheduled_posts` - Posts queued for publishing
- `analytics` - Engagement metrics

### Redis Queues

- `jobs:ingest` - Brand ingestion tasks
- `jobs:generate` - Content generation tasks
- `jobs:render` - Video rendering tasks
- `jobs:poster` - Social media posting tasks

## Security

- All API keys and tokens stored as environment variables
- OAuth tokens encrypted at rest
- Prompt injection detection in broker
- No secrets committed to repository
