import type { MediaConfig } from './ai/types';

/**
 * 豆包文生图 - Seedream 5.0 Lite
 * API: POST /images/generations
 */
export const generateDoubaoImage = async (config: MediaConfig, prompt: string, base64Image?: string) => {
  const body: any = {
    model: config.imageModel,
    prompt,
    size: '2K',
    response_format: 'b64_json',
    watermark: false,
  };

  // 图生图：传入参考图 base64
  if (base64Image) {
    body.image = base64Image;
  }

  const response = await fetch(`${config.baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`豆包文生图 API 错误 (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error('文生图未返回图片数据');

  return `data:image/jpeg;base64,${b64}`;
};

/**
 * 豆包文生视频 - Seedance 1.0 Pro Fast
 * 异步任务：创建任务 → 轮询状态 → 获取结果
 */
export const generateDoubaoVideo = async (
  config: MediaConfig,
  prompt: string,
  onProgress: (msg: string) => void,
  base64Image?: string,
) => {
  onProgress('正在创建视频生成任务...');

  const content: any[] = [
    {
      type: 'text',
      text: prompt,
    },
  ];

  // 图生视频：添加参考图
  if (base64Image) {
    content.push({
      type: 'image_url',
      image_url: { url: base64Image },
    });
  }

  // 1. 创建任务
  const createResponse = await fetch(`${config.baseUrl}/contents/generations/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.videoModel,
      content,
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`豆包视频任务创建失败 (${createResponse.status}): ${errorText}`);
  }

  const task = await createResponse.json();
  const taskId = task.id;
  if (!taskId) throw new Error('视频任务未返回 task ID');

  onProgress('视频生成中，请稍候...');

  // 2. 轮询任务状态
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const queryResponse = await fetch(`${config.baseUrl}/contents/generations/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (!queryResponse.ok) {
      throw new Error(`查询视频任务失败 (${queryResponse.status})`);
    }

    const result = await queryResponse.json();
    const status = result.status;

    if (status === 'succeeded') {
      const videoUrl = result.content?.video_url || result.content?.[0]?.video_url;
      if (!videoUrl) throw new Error('视频生成完成但未返回视频链接');

      // 下载视频转为 Blob URL
      const videoResponse = await fetch(videoUrl);
      const blob = await videoResponse.blob();
      return URL.createObjectURL(blob);
    }

    if (status === 'failed') {
      throw new Error(`视频生成失败: ${result.error?.message || '未知错误'}`);
    }

    onProgress('视频正在渲染中，可能需要几分钟...');
  }
};
