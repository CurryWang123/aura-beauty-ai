import { aiConfig } from '../../config/ai.config';
import type { TextStreamAdapter } from './types';
import { GeminiAdapter } from './gemini.adapter';
import { OpenAICompatibleAdapter } from './openai-compatible.adapter';

let adapterInstance: TextStreamAdapter | null = null;

/**
 * 获取文本流式生成适配器（单例）
 * 根据 aiConfig.provider 自动选择对应的实现
 */
export function getTextStreamAdapter(): TextStreamAdapter {
  if (!adapterInstance) {
    switch (aiConfig.provider) {
      case 'gemini':
        adapterInstance = new GeminiAdapter(aiConfig);
        break;
      case 'openai-compatible':
        adapterInstance = new OpenAICompatibleAdapter(aiConfig);
        break;
      default:
        throw new Error(`未知的 AI 提供商: ${(aiConfig as any).provider}`);
    }
  }
  return adapterInstance;
}
