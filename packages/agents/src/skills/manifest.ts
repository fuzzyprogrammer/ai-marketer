// Skills Manifest
// This file defines available skills and their mount points for agent workers.

export interface SkillManifest {
  name: string;
  description: string;
  version: string;
  author: string;
  mountPoint: string;
  entryPoint: string;
  dependencies?: string[];
  config?: Record<string, any>;
}

export const skillsManifest: SkillManifest[] = [
  {
    name: 'brand-analyzer',
    description: 'Analyze brand websites and extract structured profiles',
    version: '1.0.0',
    author: 'ai-marketer',
    mountPoint: './skills/brand-analyzer',
    entryPoint: './index.ts',
  },
  {
    name: 'content-generator',
    description: 'Generate marketing content using AI models',
    version: '1.0.0',
    author: 'ai-marketer',
    mountPoint: './skills/content-generator',
    entryPoint: './index.ts',
  },
  {
    name: 'trend-scanner',
    description: 'Scan trending topics and generate relevant content ideas',
    version: '1.0.0',
    author: 'ai-marketer',
    mountPoint: './skills/trend-scanner',
    entryPoint: './index.ts',
  },
  {
    name: 'social-poster',
    description: 'Post content to social media platforms',
    version: '1.0.0',
    author: 'ai-marketer',
    mountPoint: './skills/social-poster',
    entryPoint: './index.ts',
  },
  {
    name: 'video-renderer',
    description: 'Render HTML compositions to video',
    version: '1.0.0',
    author: 'ai-marketer',
    mountPoint: './skills/video-renderer',
    entryPoint: './index.ts',
  },
];

export function getSkill(name: string): SkillManifest | undefined {
  return skillsManifest.find(s => s.name === name);
}

export function listSkills(): SkillManifest[] {
  return skillsManifest;
}
