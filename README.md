# AI Marketer

Self-hostable, zero-cost-first AI marketing automation platform.

## Features

- **Brand Ingestion**: Import brand profiles from websites or uploaded files
- **AI Content Generation**: Auto-generate posts, articles, images, and videos using free-tier AI models
- **Trend Awareness**: Scan trending topics and generate relevant content
- **Local Video Rendering**: Deterministic HTML-to-video pipeline using Puppeteer + FFmpeg
- **Social Scheduling**: OAuth connectors for X, Pinterest, YouTube, Instagram
- **Quota-Aware Broker**: Routes across free model tiers with compression and caching
- **Multi-Agent Orchestration**: Parallel worker agents for ingest, generation, rendering, and posting

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed design.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- npm or pnpm

### Development

```bash
# Clone and setup
git clone https://github.com/fuzzyprogrammer/ai-marketer.git
cd ai-marketer
git checkout -b copilot

# Start dev stack
docker compose up --build

# Start services locally
npm install
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in required values.

## Packages

| Package | Description |
|---------|-------------|
| `packages/api` | Main API server with brand management, job queues, and webhooks |
| `packages/broker` | Model broker proxying to OmniRoute with compression and quota management |
| `packages/workers/ingest` | Website/file ingestion and brand profile extraction |
| `packages/workers/generator` | Content generation using AI models |
| `packages/workers/render-worker` | HTML-to-video rendering pipeline |
| `packages/workers/poster` | Social media posting connectors |
| `packages/frontend` | Next.js admin dashboard |
| `packages/agents` | Agent orchestration and skill management |

## Roadmap

- **Milestone 0**: Repo scaffold ✅
- **Milestone 1**: MVP E2E (ingest → generate → render → post)
- **Milestone 2**: Compression & quota routing
- **Milestone 3**: Multi-channel posting & analytics
- **Milestone 4**: Agent orchestration & skills
- **Milestone 5**: Production hardening

## License

Apache-2.0
