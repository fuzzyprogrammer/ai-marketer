import { GenerateOptions } from '../types/adapter';

export class CompressionPipeline {
  async compress(prompt: string, options: GenerateOptions): Promise<string> {
    let compressed = prompt;

    // Step 1: Lite trimming - remove excess whitespace and long links
    compressed = this.liteTrim(compressed);

    // Step 2: Session dedup - remove repeated content
    compressed = this.sessionDedup(compressed);

    // Step 3: RTK-like preservation for code/URLs
    compressed = this.preserveStructure(compressed);

    // Step 4: Caveman - aggressive summary for long prose (use small model in production)
    if (compressed.length > 2000) {
      compressed = await this.cavemanSummary(compressed);
    }

    return compressed;
  }

  private liteTrim(text: string): string {
    // Remove excess whitespace
    text = text.replace(/\s+/g, ' ').trim();
    // Shorten long URLs
    text = text.replace(/(https?:\/\/\S{100,})/g, '$1...');
    return text;
  }

  private sessionDedup(text: string): string {
    // Simple dedup: remove consecutive duplicate lines
    const lines = text.split('\n');
    const unique: string[] = [];
    let lastLine = '';

    for (const line of lines) {
      if (line !== lastLine) {
        unique.push(line);
        lastLine = line;
      }
    }

    return unique.join('\n');
  }

  private preserveStructure(text: string): string {
    // Preserve code blocks and URLs
    // In production, this would use more sophisticated parsing
    return text;
  }

  private async cavemanSummary(text: string): Promise<string> {
    // In production, use a small local model for summarization
    // For now, truncate to estimated token budget
    const maxChars = 1500;
    if (text.length <= maxChars) return text;

    // Keep the beginning and end, truncate the middle
    const head = text.substring(0, maxChars / 2);
    const tail = text.substring(text.length - maxChars / 2);

    return `${head}\n...\n${tail}`;
  }
}
