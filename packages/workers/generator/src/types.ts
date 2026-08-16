export interface WorkerJob {
  id: string;
  type: 'ingest' | 'generate' | 'render' | 'poster';
  data: any;
  brandId?: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface GenerateRequest {
  model: string;
  type: 'text' | 'image' | 'tts';
  prompt: string;
  brandId: string;
  maxTokens?: number;
  mode: 'production' | 'sandbox';
}

export interface GenerateResponse {
  id: string;
  output: string;
  tokensUsed: number;
  provider: string;
  'X-Decision'?: string;
  'X-Tokens-Used'?: string;
  'X-Cache-Hit'?: string;
}
