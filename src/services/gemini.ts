import { getTextStreamAdapter } from './ai';

// 重新导出媒体生成函数，保持 App.tsx 的 import 路径不变
export { generatePackagingDesign, generateMarketingVideo } from './gemini-media';

export const generateBrandStrategyStream = async (prompt: string, systemInstruction: string = "You are a world-class beauty brand consultant.") => {
  const adapter = getTextStreamAdapter();
  return adapter.generateContentStream(
    prompt,
    `${systemInstruction}

      重要提示：
      1. 请务必使用 Markdown 表格来展示分类数据、竞品对比、价位带分布等。
      2. 如果涉及数值类数据（如市场份额、价格区间），请在回复末尾提供一个符合以下格式的 JSON 代码块，以便系统渲染图表：
      \`\`\`chart-data
      {
        "type": "bar" | "pie" | "line",
        "title": "图表标题",
        "data": [
          { "name": "类别A", "value": 10 },
          { "name": "类别B", "value": 20 }
        ]
      }
      \`\`\`
      3. 确保分析深度专业，语气优雅且富有洞察力。`,
  );
};

export const refineContentStream = async (previousContent: string, refinementPrompt: string, context: string) => {
  const adapter = getTextStreamAdapter();
  return adapter.generateContentStream(
    `【当前内容】\n${previousContent}\n\n【用户追问/补充要求】\n${refinementPrompt}\n\n【品牌背景信息】\n${context}`,
    "你是一位世界级的美妆品牌顾问。请根据用户的追问或补充要求，对当前内容进行优化、扩充或解答。你可以选择在原有内容基础上进行修改，或者以对话的形式补充新的见解。请保持专业、优雅且富有洞察力的语气。如果是补充内容，请确保与原有内容逻辑连贯。",
  );
};

export const generateFormulaDesignStream = async (prompt: string, systemInstruction: string) => {
  const adapter = getTextStreamAdapter();
  return adapter.generateContentStream(prompt, systemInstruction);
};

export const generateProductionSpecsStream = async (projectName: string, visualIdentity: string) => {
  const adapter = getTextStreamAdapter();
  return adapter.generateContentStream(
    `为品牌 "${projectName}" 生成详细的印刷生产技术规范及【Adobe软件技术图纸操作指南】。视觉识别系统参考: ${visualIdentity}。
    请包含以下核心板块：
    1. 印刷参数：CMYK色值、Pantone色号、纸张材质建议、特殊工艺（烫金、UV、击凸）。
    2. Adobe Illustrator/Photoshop 绘图指南：
    - 详细说明如何根据生成的刀版图（Dieline）在软件中建立图层。
    - 标注裁切线（Trim）、出血位（Bleed）、折线（Fold）的颜色与线宽规范。
    - 智能对象与链接文件的管理建议。
    3. 生产交付标准：导出格式（PDF/X-4）、分辨率要求、色彩配置文件。
    请使用严谨的工业级技术文档格式。`,
    "You are a senior print production specialist and digital asset manager. You provide highly technical specifications for luxury beauty packaging, specifically focusing on how to structure editable PSD files for professional manufacturing.",
  );
};
