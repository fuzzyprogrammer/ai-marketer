export interface AdapterInterface {
  getName(): string;
  health(): Promise<boolean>;
  generate(options: GenerateOptions): Promise<GenerateResult>;
  embed(text: string): Promise<number[]>;
  image(prompt: string): Promise<string>;
  tts(text: string): Promise<string>;
  usage(): Promise<ProviderUsage>;
}

export interface GenerateOptions {
  type: 'text' | 'image' | 'tts';
  prompt: string;
  maxTokens?: number;
  model?: string;
  mode?: 'production' | 'sandbox';
}

export interface GenerateResult {
  id: string;
  output: string;
  tokensUsed: number;
  provider: string;
}

export interface ProviderUsage {
  provider: string;
  dailyTokens: number;
  dailyLimit: number;
  remaining: number;
}
