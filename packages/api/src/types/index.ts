export interface BrandProfile {
  id: string;
  name: string;
  short_description: string;
  long_description: string;
  categories: string[];
  tone: string;
  audience: string[];
  website_url: string;
  logo_url: string;
  key_products: string[];
  canonical_pages: string[];
  contact_email: string;
  extracted_keywords: string[];
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  type: 'ingest' | 'generate' | 'render' | 'poster';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  brand_id?: string;
  data: any;
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentDraft {
  id: string;
  brand_id: string;
  type: string;
  content: string;
  status: 'draft' | 'approved' | 'rejected' | 'scheduled';
  metadata: any;
  created_at: string;
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
  providerDecisionHeader?: any;
}
