import { GoogleGenAI } from '@google/genai';
import type { AIProviderConfig, TextStreamAdapter, AIStreamChunk } from './types';

export class GeminiAdapter implements TextStreamAdapter {
  private ai: GoogleGenAI;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async generateContentStream(
    prompt: string,
    systemInstruction?: string,
  ): Promise<AsyncIterable<AIStreamChunk>> {
    const response = await this.ai.models.generateContentStream({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });
    // Gemini SDK 返回的流天然兼容 AIStreamChunk（每个 chunk 有 .text 属性）
    return response as AsyncIterable<AIStreamChunk>;
  }
}
