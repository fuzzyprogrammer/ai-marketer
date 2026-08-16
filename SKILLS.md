# Skills

This document describes the skills system for AI Marketer. Skills are reusable workflows that agents can use.

## Skill Manifest

Skills are defined in `packages/agents/src/skills/manifest.ts`. Each skill has:

- `name` - Unique identifier
- `description` - What the skill does
- `version` - Semantic version
- `author` - Skill creator
- `mountPoint` - Directory where skill code lives
- `entryPoint` - Main file to execute
- `dependencies` - Optional npm packages
- `config` - Optional configuration

## Available Skills

### brand-analyzer
Analyzes brand websites and extracts structured profiles including:
- Company name and description
- Product lines
- Target audience
- Tone of voice
- Key keywords

### content-generator
Generates marketing content using AI models:
- Social media posts
- Blog outlines
- Hashtag sets
- Email copy

### trend-scanner
Scans trending topics from multiple sources:
- Reddit
- Hacker News
- Twitter/X trending
- YouTube trending
- Google Trends (where available)

### social-poster
Posts content to social media platforms:
- Twitter/X
- Pinterest
- YouTube
- Instagram

### video-renderer
Renders HTML compositions to video:
- Takes HTML templates with data attributes
- Uses Puppeteer for frame capture
- Uses FFmpeg for encoding
- Supports custom durations and FPS

## Adding New Skills

1. Add skill entry to `manifest.ts`
2. Create skill directory at mount point
3. Implement skill entry point
4. Register skill in agent orchestrator

```typescript
// Example skill structure
skills/
  my-skill/
    index.ts        // Entry point
    types.ts        // Type definitions
    utils.ts        // Helper functions
    package.json    // Dependencies
```

## Skill Interface

```typescript
export interface Skill {
  name: string;
  version: string;
  
  // Initialize skill
  init(config?: Record<string, any>): Promise<void>;
  
  // Execute skill with input
  execute(input: any): Promise<any>;
  
  // Cleanup resources
  destroy(): Promise<void>;
}
```

## Running Skills

Skills are executed by the agent orchestrator:

```typescript
const orchestrator = new AgentOrchestrator();
const skill = orchestrator.getSkill('brand-analyzer');
const result = await skill.execute({ url: 'https://example.com' });
```

## Development

To develop a new skill:

1. Create the skill directory
2. Implement the Skill interface
3. Add to manifest
4. Write tests
5. Update SKILLS.md documentation
