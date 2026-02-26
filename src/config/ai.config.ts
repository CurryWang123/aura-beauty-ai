import type { AIProviderConfig, MediaConfig } from '../services/ai/types';

/**
 * 文本生成 AI 配置
 * 切换提供商只需修改此处配置
 */

// ===== Gemini 配置 =====
// export const aiConfig: AIProviderConfig = {
//   provider: 'gemini',
//   apiKey: process.env.GEMINI_API_KEY!,
//   model: 'gemini-3-flash-preview',
// };

// ===== 豆包（火山引擎）配置（当前激活） =====
export const aiConfig: AIProviderConfig = {
  provider: 'openai-compatible',
  apiKey: process.env.DOUBAO_API_KEY!,
  model: 'doubao-seed-1-8-251228',
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
};

// ===== OpenAI 配置 =====
// export const aiConfig: AIProviderConfig = {
//   provider: 'openai-compatible',
//   apiKey: process.env.OPENAI_API_KEY!,
//   model: 'gpt-4o',
//   baseUrl: 'https://api.openai.com/v1',
// };

/**
 * 媒体生成配置（图片/视频）
 */

// ===== 豆包媒体配置（当前激活） =====
export const mediaConfig: MediaConfig = {
  provider: 'doubao',
  apiKey: process.env.DOUBAO_API_KEY!,
  imageModel: 'doubao-seedream-5-0-lite',
  videoModel: 'doubao-seedance-1-0-pro-fast',
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
};

// ===== Gemini 媒体配置 =====
// export const mediaConfig: MediaConfig = {
//   provider: 'gemini',
//   apiKey: process.env.GEMINI_API_KEY!,
//   imageModel: 'gemini-2.5-flash-image',
//   videoModel: 'veo-3.1-fast-generate-preview',
// };
