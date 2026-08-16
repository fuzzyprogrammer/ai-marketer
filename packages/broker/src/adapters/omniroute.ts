import axios from 'axios';
import pino from 'pino';
import { AdapterInterface, GenerateOptions, GenerateResult } from '../types/adapter';

export class OmniRouteAdapter implements AdapterInterface {
  private baseUrl: string;
  private logger: pino.Logger;

  constructor(baseUrl: string, logger: pino.Logger) {
    this.baseUrl = baseUrl;
    this.logger = logger.child({ module: 'omniroute-adapter' });
  }

  getName(): string {
    return 'omniroute';
  }

  async health(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const response = await axios.post(`${this.baseUrl}/v1/chat/completions`, {
      model: options.model || 'auto',
      messages: [{ role: 'user', content: options.prompt }],
      max_tokens: options.maxTokens,
      temperature: 0.7,
    });

    const output = response.data.choices?.[0]?.message?.content || '';
    const tokensUsed = response.data.usage?.total_tokens || output.length;

    return {
      id: `or-${Date.now()}`,
      output,
      tokensUsed,
      provider: 'omniroute',
    };
  }

  async embed(text: string): Promise<number[]> {
    const response = await axios.post(`${this.baseUrl}/v1/embeddings`, {
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data.data?.[0]?.embedding || [];
  }

  async image(prompt: string): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/v1/images/generations`, {
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
    });

    return response.data.data?.[0]?.url || '';
  }

  async tts(text: string): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/v1/audio/speech`, {
      model: 'tts-1',
      input: text,
      voice: 'alloy',
    });

    // Return audio URL or base64
    return '';
  }
}
