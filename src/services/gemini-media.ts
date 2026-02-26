import { GoogleGenAI } from '@google/genai';
import { mediaConfig } from '../config/ai.config';
import { generateDoubaoImage, generateDoubaoVideo } from './doubao-media';

/**
 * 统一的图片生成函数
 * 根据 mediaConfig.provider 自动选择 Gemini 或豆包
 */
export const generatePackagingDesign = async (prompt: string, base64Image?: string) => {
  const fullPrompt = `High-end beauty product packaging design: ${prompt}. Professional studio photography, elegant lighting, luxury aesthetic.`;

  if (mediaConfig.provider === 'doubao') {
    return generateDoubaoImage(mediaConfig, fullPrompt, base64Image);
  }

  // Gemini 实现
  const ai = new GoogleGenAI({ apiKey: mediaConfig.apiKey });
  const parts: any[] = [{ text: fullPrompt }];

  if (base64Image) {
    const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      parts.unshift({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    }
  }

  const response = await ai.models.generateContent({
    model: mediaConfig.imageModel,
    contents: { parts },
    config: {
      imageConfig: { aspectRatio: '1:1' },
    },
  });

  for (const part of response.candidates![0].content!.parts!) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

/**
 * 统一的视频生成函数
 * 根据 mediaConfig.provider 自动选择 Gemini 或豆包
 */
export const generateMarketingVideo = async (
  prompt: string,
  onProgress: (msg: string) => void,
  base64Image?: string,
) => {
  const fullPrompt = `Cinematic beauty commercial: ${prompt}. Slow motion, high-end production value, elegant transitions.`;

  if (mediaConfig.provider === 'doubao') {
    return generateDoubaoVideo(mediaConfig, fullPrompt, onProgress, base64Image);
  }

  // Gemini 实现
  const ai = new GoogleGenAI({ apiKey: mediaConfig.apiKey });
  onProgress('Initializing video generation...');

  let imageConfig: any = undefined;
  if (base64Image) {
    const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      imageConfig = { imageBytes: match[2], mimeType: match[1] };
    }
  }

  let operation = await ai.models.generateVideos({
    model: mediaConfig.videoModel,
    prompt: fullPrompt,
    image: imageConfig,
    config: {
      numberOfVideos: 1,
      resolution: '1080p',
      aspectRatio: '16:9',
    },
  });

  while (!operation.done) {
    onProgress('Crafting your cinematic commercial... This may take a few minutes.');
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error('Video generation failed');

  const response = await fetch(downloadLink, {
    method: 'GET',
    headers: { 'x-goog-api-key': mediaConfig.apiKey },
  });

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
