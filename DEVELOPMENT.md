# AI Marketer - Development Guide

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)

## Local Development

### 1. Clone and Setup

```bash
git clone https://github.com/fuzzyprogrammer/ai-marketer.git
cd ai-marketer
git checkout -b copilot
```

### 2. Start Services

```bash
# Start all services with Docker
docker compose up -d

# Wait for services to be ready
docker compose ps
```

### 3. Database Setup

```bash
# Create database
docker exec -i ai-marketer-postgres psql -U ai_marketer -d ai_marketer < scripts/schema.sql
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 6. Start Development Servers

```bash
# Start all services
npm run dev

# Or start individually
npm run dev:api
npm run dev:broker
npm run dev:frontend
```

### 7. Start Workers

```bash
# In separate terminals
cd packages/workers/ingest && npm run dev
cd packages/workers/generator && npm run dev
cd packages/workers/render-worker && npm run dev
cd packages/workers/poster && npm run dev
```

## API Endpoints

### Brands

```bash
# Import brand from URL
POST /api/brands/import
{
  "sourceUrl": "https://example.com"
}

# List brands
GET /api/brands

# Get brand
GET /api/brands/:id
```

### Jobs

```bash
# List jobs
GET /api/jobs?status=pending&type=generate

# Get job
GET /api/jobs/:id

# Cancel job
POST /api/jobs/:id/cancel
```

### Broker

```bash
# Generate content
POST /api/broker/generate
{
  "model": "auto",
  "type": "text",
  "prompt": "Create a social post",
  "brandId": "uuid",
  "maxTokens": 500
}
```

### Admin

```bash
# Get stats
GET /api/admin/stats

# Get queue status
GET /api/admin/queue
```

## Testing

```bash
# Run all tests
npm run test

# Run tests for specific package
npm run test --workspace=packages/api
```

## Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=packages/frontend
```

## Docker Development

```bash
# Build and start all services
docker compose up --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## Project Structure

```
ai-marketer/
├── packages/
│   ├── api/                 # Main API server
│   ├── broker/             # Model broker
│   ├── workers/
│   │   ├── ingest/         # Brand ingestion
│   │   ├── generator/      # Content generation
│   │   ├── render-worker/  # Video rendering
│   │   └── poster/         # Social posting
│   ├── frontend/           # Next.js UI
│   └── agents/             # Agent orchestration
├── scripts/
│   └── schema.sql          # Database schema
├── docker-compose.yml
├── Dockerfile.api
├── Dockerfile.broker
├── Dockerfile.worker
└── package.json
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

Apache-2.0
