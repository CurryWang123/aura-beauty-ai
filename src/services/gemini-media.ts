import { GoogleGenAI } from '@google/genai';
import { geminiMediaConfig } from '../config/ai.config';

const getAI = () => new GoogleGenAI({ apiKey: geminiMediaConfig.apiKey });

export const generatePackagingDesign = async (prompt: string, base64Image?: string) => {
  const ai = getAI();
  const parts: any[] = [{ text: `High-end beauty product packaging design: ${prompt}. Professional studio photography, elegant lighting, luxury aesthetic.` }];

  if (base64Image) {
    const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      parts.unshift({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
    }
  }

  const response = await ai.models.generateContent({
    model: geminiMediaConfig.imageModel,
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates![0].content!.parts!) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateMarketingVideo = async (prompt: string, onProgress: (msg: string) => void, base64Image?: string) => {
  const ai = getAI();

  onProgress("Initializing video generation...");

  let imageConfig: any = undefined;
  if (base64Image) {
    const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      imageConfig = {
        imageBytes: match[2],
        mimeType: match[1]
      };
    }
  }

  let operation = await ai.models.generateVideos({
    model: geminiMediaConfig.videoModel,
    prompt: `Cinematic beauty commercial: ${prompt}. Slow motion, high-end production value, elegant transitions.`,
    image: imageConfig,
    config: {
      numberOfVideos: 1,
      resolution: '1080p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    onProgress("Crafting your cinematic commercial... This may take a few minutes.");
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");

  const response = await fetch(downloadLink, {
    method: 'GET',
    headers: {
      'x-goog-api-key': geminiMediaConfig.apiKey,
    },
  });

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
