/**
 * AI 流式输出的单个 chunk
 * 与 Gemini SDK 的 chunk.text 消费方式一致
 */
export interface AIStreamChunk {
  text: string;
}

/**
 * 文本流式生成的统一适配器接口
 */
export interface TextStreamAdapter {
  generateContentStream(
    prompt: string,
    systemInstruction?: string,
  ): Promise<AsyncIterable<AIStreamChunk>>;
}

/**
 * AI 提供商配置
 */
export type AIProviderType = 'gemini' | 'openai-compatible';

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  model: string;
  /** OpenAI 兼容接口的 baseUrl，如豆包: https://ark.cn-beijing.volces.com/api/v3 */
  baseUrl?: string;
}

/**
 * Gemini 媒体生成配置（图片/视频，Gemini 专属）
 */
export interface GeminiMediaConfig {
  apiKey: string;
  imageModel: string;
  videoModel: string;
}
