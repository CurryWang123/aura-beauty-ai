import type { AIProviderConfig, GeminiMediaConfig } from '../services/ai/types';

/**
 * 文本生成 AI 配置
 * 切换提供商只需修改此处配置
 */

// ===== Gemini 配置（默认） =====
export const aiConfig: AIProviderConfig = {
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-3-flash-preview',
};

// ===== 豆包（火山引擎）配置 =====
// export const aiConfig: AIProviderConfig = {
//   provider: 'openai-compatible',
//   apiKey: process.env.DOUBAO_API_KEY!,
//   model: 'ep-xxxxx', // 替换为实际的 endpoint ID
//   baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
// };

// ===== OpenAI 配置 =====
// export const aiConfig: AIProviderConfig = {
//   provider: 'openai-compatible',
//   apiKey: process.env.OPENAI_API_KEY!,
//   model: 'gpt-4o',
//   baseUrl: 'https://api.openai.com/v1',
// };

/**
 * Gemini 媒体生成配置（图片/视频，独立于文本 provider）
 */
export const geminiMediaConfig: GeminiMediaConfig = {
  apiKey: process.env.GEMINI_API_KEY!,
  imageModel: 'gemini-2.5-flash-image',
  videoModel: 'veo-3.1-fast-generate-preview',
};
