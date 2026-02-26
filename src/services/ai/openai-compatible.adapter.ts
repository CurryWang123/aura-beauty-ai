import type { AIProviderConfig, TextStreamAdapter, AIStreamChunk } from './types';

export class OpenAICompatibleAdapter implements TextStreamAdapter {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  async generateContentStream(
    prompt: string,
    systemInstruction?: string,
  ): Promise<AsyncIterable<AIStreamChunk>> {
    const messages: Array<{ role: string; content: string }> = [];

    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    return this.parseSSEStream(response.body!);
  }

  private async *parseSSEStream(
    body: ReadableStream<Uint8Array>,
  ): AsyncIterable<AIStreamChunk> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // 保留最后一个可能不完整的行
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield { text: content };
            }
          } catch {
            // 跳过非 JSON 行
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
