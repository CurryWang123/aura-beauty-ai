/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BarChart3, 
  BookOpen, 
  Palette, 
  Package, 
  Video, 
  ChevronRight, 
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Printer,
  Send,
  RefreshCw,
  FlaskConical,
  Upload,
  X,
  Image as ImageIcon,
  Plus,
  History as HistoryIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { BrandProject, BrandStage, ChatMessage } from './types';
import { 
  generateBrandStrategyStream, 
  generatePackagingDesign, 
  generateMarketingVideo, 
  generateProductionSpecsStream, 
  refineContentStream, 
  generateFormulaDesignStream 
} from './services/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STAGES: { id: BrandStage; label: string; icon: React.ReactNode; description: string; color: string; textColor: string }[] = [
  { id: 'market-analysis', label: '市场分析', icon: <BarChart3 className="w-5 h-5" />, description: '深度洞察行业趋势与竞争格局', color: '#98FFD9', textColor: '#064E3B' },
  { id: 'brand-story', label: '品牌故事', icon: <BookOpen className="w-5 h-5" />, description: '构建动人心弦的品牌内核与叙事', color: '#C5B4FF', textColor: '#312E81' },
  { id: 'formula-design', label: '配方设计', icon: <FlaskConical className="w-5 h-5" />, description: '专业化的化妆品配方研发与设计', color: '#FFD6FF', textColor: '#701A75' },
  { id: 'visual-identity', label: '视觉识别', icon: <Palette className="w-5 h-5" />, description: '定义品牌美学与视觉语言', color: '#FFF2B2', textColor: '#713F12' },
  { id: 'packaging-design', label: '包装设计', icon: <Package className="w-5 h-5" />, description: '创意产品包装渲染与生产文件', color: '#B2EBF2', textColor: '#164E63' },
  { id: 'marketing-video', label: '营销短视频', icon: <Video className="w-5 h-5" />, description: '生成电影级产品推广视频', color: '#FFE0B2', textColor: '#7C2D12' },
];

export default function App() {
  const [project, setProject] = useState<BrandProject>({
    name: '',
    targetAudience: '',
    salesChannels: '',
    salesRegions: '',
    painPoints: '',
    coreValues: '',
    history: {},
    currentVersion: {},
  });
  const [currentStage, setCurrentStage] = useState<BrandStage>('market-analysis');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState<Record<string, boolean>>({});
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [viewingHistory, setViewingHistory] = useState<BrandStage | null>(null);
  
  // Refinement states
  const [refinementInputs, setRefinementInputs] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const startNewSession = (stage: BrandStage) => {
    setProject(prev => {
      const next = { ...prev };
      const currentData: any = {};
      
      // Capture current stage data
      if (stage === 'market-analysis') currentData.marketAnalysis = prev.marketAnalysis;
      if (stage === 'brand-story') currentData.brandStory = prev.brandStory;
      if (stage === 'formula-design') currentData.formulaDesign = prev.formulaDesign;
      if (stage === 'visual-identity') {
        currentData.visualIdentity = prev.visualIdentity;
        currentData.visualIdentityImage = prev.visualIdentityImage;
      }
      if (stage === 'packaging-design') {
        currentData.packagingDesign = prev.packagingDesign;
        currentData.packagingImage = prev.packagingImage;
      }
      if (stage === 'marketing-video') currentData.marketingVideoUrl = prev.marketingVideoUrl;

      // Add to history if it has content
      const hasContent = Object.values(currentData).some(v => v !== undefined && v !== null);
      if (hasContent) {
        const stageHistory = prev.history[stage] || [];
        next.history = {
          ...prev.history,
          [stage]: [...stageHistory, { ...currentData, timestamp: Date.now() }]
        };
      }

      // Clear current stage data
      if (stage === 'market-analysis') next.marketAnalysis = undefined;
      if (stage === 'brand-story') next.brandStory = undefined;
      if (stage === 'formula-design') next.formulaDesign = undefined;
      if (stage === 'visual-identity') {
        next.visualIdentity = undefined;
        next.visualIdentityImage = undefined;
      }
      if (stage === 'packaging-design') {
        next.packagingDesign = undefined;
        next.packagingImage = undefined;
      }
      if (stage === 'marketing-video') next.marketingVideoUrl = undefined;

      next.currentVersion = { ...prev.currentVersion, [stage]: undefined };
      return next;
    });
    // Clear custom inputs for this stage
    setCustomInputs(prev => ({ ...prev, [stage]: '' }));
  };

  const switchVersion = (stage: BrandStage, index: number | 'current') => {
    setProject(prev => {
      const next = { ...prev };
      const stageHistory = prev.history[stage] || [];
      
      // If switching from current to a history version, we might want to save current first?
      // For simplicity, let's assume "New" button handles saving.
      
      let targetData;
      if (index === 'current') {
        // This logic is a bit tricky if we cleared it. 
        // Usually we'd just stay in the current "new" session.
        return prev;
      } else {
        targetData = stageHistory[index];
      }

      if (targetData) {
        if (stage === 'market-analysis') next.marketAnalysis = targetData.marketAnalysis;
        if (stage === 'brand-story') next.brandStory = targetData.brandStory;
        if (stage === 'formula-design') next.formulaDesign = targetData.formulaDesign;
        if (stage === 'visual-identity') {
          next.visualIdentity = targetData.visualIdentity;
          next.visualIdentityImage = targetData.visualIdentityImage;
        }
        if (stage === 'packaging-design') {
          next.packagingDesign = targetData.packagingDesign;
          next.packagingImage = targetData.packagingImage;
        }
        if (stage === 'marketing-video') next.marketingVideoUrl = targetData.marketingVideoUrl;
        
        next.currentVersion = { ...prev.currentVersion, [stage]: index };
      }

      return next;
    });
  };

  const handleStreamingResponse = async (
    streamPromise: Promise<any>,
    updateFn: (content: string) => void
  ) => {
    const stream = await streamPromise;
    let fullContent = '';
    for await (const chunk of stream) {
      fullContent += chunk.text;
      updateFn(fullContent);
    }
    return fullContent;
  };

  const handleRefine = async (stage: BrandStage | 'production-file') => {
    const prompt = refinementInputs[stage];
    if (!prompt) return;

    setIsLocalLoading(prev => ({ ...prev, [stage]: true }));
    try {
      let currentContent = '';
      let context = `Brand: ${project.name}, Audience: ${project.targetAudience}, Channels: ${project.salesChannels}, Regions: ${project.salesRegions}, Pain Points: ${project.painPoints}`;
      
      if (stage === 'market-analysis') {
        currentContent = project.marketAnalysis?.map(m => `${m.role === 'user' ? 'User: ' : 'Assistant: '}${m.content}`).join('\n\n') || '';
      } else if (stage === 'brand-story') {
        currentContent = project.brandStory?.map(m => `${m.role === 'user' ? 'User: ' : 'Assistant: '}${m.content}`).join('\n\n') || '';
      } else if (stage === 'formula-design') {
        currentContent = project.formulaDesign?.map(m => `${m.role === 'user' ? 'User: ' : 'Assistant: '}${m.content}`).join('\n\n') || '';
      } else if (stage === 'visual-identity') {
        currentContent = project.visualIdentity?.map(m => `${m.role === 'user' ? 'User: ' : 'Assistant: '}${m.content}`).join('\n\n') || '';
      } else if (stage === 'packaging-design') {
        currentContent = project.packagingDesign?.map(m => `${m.role === 'user' ? 'User: ' : 'Assistant: '}${m.content}`).join('\n\n') || '';
      } else {
        switch(stage) {
          case 'production-file': currentContent = project.productionSpecs || ''; break;
        }
      }

      // Add user message and placeholder assistant message
      setProject(prev => {
        const next = { ...prev };
        const userMsg = { role: 'user' as const, content: prompt };
        const assistantMsg = { role: 'assistant' as const, content: '正在思考...' };
        
        if (stage === 'market-analysis') next.marketAnalysis = [...(prev.marketAnalysis || []), userMsg, assistantMsg];
        else if (stage === 'brand-story') next.brandStory = [...(prev.brandStory || []), userMsg, assistantMsg];
        else if (stage === 'formula-design') next.formulaDesign = [...(prev.formulaDesign || []), userMsg, assistantMsg];
        else if (stage === 'visual-identity') next.visualIdentity = [...(prev.visualIdentity || []), userMsg, assistantMsg];
        else if (stage === 'packaging-design') next.packagingDesign = [...(prev.packagingDesign || []), userMsg, assistantMsg];
        else if (stage === 'production-file') next.productionSpecs = '正在优化生产规范...';
        
        return next;
      });

      let result = '';
      let newImageUrl: string | null | undefined = undefined;

      const updateProjectContent = (content: string) => {
        setProject(prev => {
          const next = { ...prev };
          if (stage === 'market-analysis') {
            const history = [...(prev.marketAnalysis || [])];
            if (history.length > 0) history[history.length - 1].content = content;
            next.marketAnalysis = history;
          }
          else if (stage === 'brand-story') {
            const history = [...(prev.brandStory || [])];
            if (history.length > 0) history[history.length - 1].content = content;
            next.brandStory = history;
          }
          else if (stage === 'formula-design') {
            const history = [...(prev.formulaDesign || [])];
            if (history.length > 0) history[history.length - 1].content = content;
            next.formulaDesign = history;
          }
          else if (stage === 'visual-identity') {
            const history = [...(prev.visualIdentity || [])];
            if (history.length > 0) history[history.length - 1].content = content;
            next.visualIdentity = history;
          }
          else if (stage === 'packaging-design') {
            const history = [...(prev.packagingDesign || [])];
            if (history.length > 0) history[history.length - 1].content = content;
            next.packagingDesign = history;
          }
          else if (stage === 'production-file') next.productionSpecs = content;
          return next;
        });
      };

      if (stage === 'visual-identity') {
        const imagePrompt = `Update the visual identity moodboard for "${project.name}" based on: ${prompt}. Maintain luxury beauty aesthetic.`;
        const [textResult, imageUrl] = await Promise.all([
          handleStreamingResponse(refineContentStream(currentContent, prompt, context), updateProjectContent),
          generatePackagingDesign(imagePrompt)
        ]);
        result = textResult;
        newImageUrl = imageUrl;
      } else if (stage === 'packaging-design') {
        const imagePrompt = `Update packaging design for "${project.name}" based on: ${prompt}. High-end beauty product.`;
        const [textResult, imageUrl] = await Promise.all([
          handleStreamingResponse(refineContentStream(currentContent, `${prompt} (请注意：文字说明请言简意赅，字数限制在500字以内)`, context), updateProjectContent),
          generatePackagingDesign(imagePrompt, project.packagingReferenceImage)
        ]);
        result = textResult;
        newImageUrl = imageUrl;
      } else {
        result = await handleStreamingResponse(refineContentStream(currentContent, prompt, context), updateProjectContent);
      }
      
      if (newImageUrl) {
        setProject(prev => ({
          ...prev,
          visualIdentityImage: stage === 'visual-identity' ? newImageUrl! : prev.visualIdentityImage,
          packagingImage: stage === 'packaging-design' ? newImageUrl! : prev.packagingImage
        }));
      }
      
      setRefinementInputs(prev => ({ ...prev, [stage]: '' }));
    } catch (err) {
      setError('优化失败，请稍后重试');
    } finally {
      setIsLocalLoading(prev => ({ ...prev, [stage]: false }));
    }
  };

  const runAnalysis = async () => {
    if (!project.name || !project.targetAudience || !project.salesChannels || !project.salesRegions || !project.painPoints) {
      setError('请填写完整的品牌与市场信息');
      return;
    }
    setError(null);
    setIsLocalLoading(prev => ({ ...prev, 'market-analysis': true }));
    try {
      const prompt = `
        为品牌 "${project.name}" 进行全方位的市场分析。
        
        【输入信息】
        - 目标客群: ${project.targetAudience}
        - 售卖渠道: ${project.salesChannels}
        - 售卖地区: ${project.salesRegions}
        - 产品解决的痛点: ${project.painPoints}
        - 核心价值: ${project.coreValues}
        ${customInputs['market-analysis'] ? `- 额外要求: ${customInputs['market-analysis']}` : ''}
        
        【分析要求】
        1. 竞品调研：分析当前市场上的主要竞争对手及其优劣势。
        2. 市场份额：预估或引用行业数据说明当前市场份额分布。
        3. 竞品品牌矩阵：通过表格或分类展示竞品的品牌定位矩阵。
        4. 竞品价位带：详细列出竞品的价格区间分布。
        5. 深度分析上述维度的行业现状与趋势。
        6. 提供品牌定位的差异化建议（USP）。
        7. 建议最适合的品牌调性与市场切入点。
        
        请务必使用 Markdown 表格展示数据，并在文末提供 chart-data JSON 块用于可视化。
      `;
      
      setProject(prev => ({ ...prev, marketAnalysis: [{ role: 'assistant', content: '正在分析市场动态...' }] }));
      
      await handleStreamingResponse(
        generateBrandStrategyStream(prompt, "You are a world-class beauty brand consultant and market strategist. Provide deep, actionable market insights and unique brand positioning strategies."),
        (content) => {
          setProject(prev => ({ ...prev, marketAnalysis: [{ role: 'assistant', content }] }));
        }
      );
    } catch (err) {
      setError('分析失败，请稍后重试');
    } finally {
      setIsLocalLoading(prev => ({ ...prev, 'market-analysis': false }));
    }
  };

  const runStorytelling = async () => {
    setIsLocalLoading(prev => ({ ...prev, 'brand-story': true }));
    try {
      const lastAnalysis = project.marketAnalysis?.[project.marketAnalysis.length - 1]?.content || '';
      const context = lastAnalysis ? `基于市场分析: ${lastAnalysis}` : `品牌名: ${project.name}, 受众: ${project.targetAudience}`;
      const prompt = `基于以下背景，为品牌 "${project.name}" 撰写品牌故事和slogan。背景: ${context}。${customInputs['brand-story'] ? `额外要求: ${customInputs['brand-story']}` : ''}。要求：情感共鸣强，符合美妆行业调性。`;
      
      setProject(prev => ({ ...prev, brandStory: [{ role: 'assistant', content: '正在构思品牌故事...' }] }));
      
      await handleStreamingResponse(
        generateBrandStrategyStream(prompt, "You are a creative brand storyteller specializing in luxury beauty."),
        (content) => {
          setProject(prev => ({ ...prev, brandStory: [{ role: 'assistant', content }] }));
        }
      );
    } catch (err) {
      setError('故事生成失败');
    } finally {
      setIsLocalLoading(prev => ({ ...prev, 'brand-story': false }));
    }
  };

  const runFormulaDesign = async () => {
    setIsLocalLoading(prev => ({ ...prev, 'formula-design': true }));
    try {
      const context = `品牌: ${project.name}, 痛点: ${project.painPoints}, 核心价值: ${project.coreValues}`;
      const prompt = `
        为品牌 "${project.name}" 设计专业化妆品配方。
        
        【背景信息】
        - 品牌背景: ${context}
        - 配方需求描述: ${customInputs['formula-design'] || '根据品牌调性设计一款明星产品配方'}
        
        【设计要求】
        1. 提供详细的成分表（INCI名称）。
        2. 说明核心活性成分及其功效原理。
        3. 描述产品的质地、肤感及使用体验。
        4. 提供生产工艺简述及注意事项。
        5. 确保配方符合现代美妆趋势（如纯净美容、高效修护等）。
      `;
      
      setProject(prev => ({ ...prev, formulaDesign: [{ role: 'assistant', content: '正在研发配方...' }] }));
      
      await handleStreamingResponse(
        generateFormulaDesignStream(prompt, "You are a senior cosmetic chemist and formulation scientist. Provide professional, safe, and innovative cosmetic formulations."),
        (content) => {
          setProject(prev => ({ ...prev, formulaDesign: [{ role: 'assistant', content }] }));
        }
      );
    } catch (err) {
      setError('配方设计失败');
    } finally {
      setIsLocalLoading(prev => ({ ...prev, 'formula-design': false }));
    }
  };

  const runVisualIdentity = async () => {
    setIsLocalLoading(prev => ({ ...prev, 'visual-identity': true }));
    try {
      const lastStory = project.brandStory?.[project.brandStory.length - 1]?.content || '';
      const context = lastStory ? `基于品牌故事: ${lastStory}` : `品牌名: ${project.name}, 受众: ${project.targetAudience}`;
      
      const textPrompt = `为品牌 "${project.name}" 设计视觉识别系统(VI)。背景: ${context}。${customInputs['visual-identity'] ? `额外要求: ${customInputs['visual-identity']}` : ''}。请包含：配色方案、字体建议、视觉风格描述。`;
      const imagePrompt = `A luxury beauty brand visual identity moodboard for "${project.name}". Target Audience: ${project.targetAudience}. Style: Elegant, high-end, futuristic. Include color swatches, sophisticated typography, and abstract beauty textures. Pink-purple aesthetic. ${customInputs['visual-identity'] || ''}`;

      setProject(prev => ({ ...prev, visualIdentity: [{ role: 'assistant', content: '正在设计视觉系统...' }] }));

      const [textResult, imageUrl] = await Promise.all([
        handleStreamingResponse(
          generateBrandStrategyStream(textPrompt, "You are a world-class visual identity designer for luxury brands."),
          (content) => {
            setProject(prev => ({ ...prev, visualIdentity: [{ role: 'assistant', content }] }));
          }
        ),
        generatePackagingDesign(imagePrompt)
      ]);

      setProject(prev => ({ 
        ...prev, 
        visualIdentity: [{ role: 'assistant', content: textResult }],
        visualIdentityImage: imageUrl || undefined
      }));
    } catch (err) {
      setError('视觉设计失败');
    } finally {
      setIsLocalLoading(prev => ({ ...prev, 'visual-identity': false }));
    }
  };

  const runPackaging = async () => {
    setIsLocalLoading(prev => ({ ...prev, 'packaging-design': true }));
    try {
      const lastVI = project.visualIdentity?.[project.visualIdentity.length - 1]?.content || '';
      const context = lastVI ? `视觉风格参考: ${lastVI}` : `品牌名: ${project.name}, 调性: ${project.brandStory?.[0]?.content || '现代高端'}`;
      const prompt = `品牌 "${project.name}" 的高端美妆包装。${context}。${customInputs['packaging-design'] ? `额外要求: ${customInputs['packaging-design']}` : ''}。产品类型：护肤品精华液。`;
      
      setProject(prev => ({ ...prev, packagingDesign: [{ role: 'assistant', content: '正在设计包装方案...' }] }));

      const [textResult, imageUrl] = await Promise.all([
        handleStreamingResponse(
          generateBrandStrategyStream(`为品牌 "${project.name}" 描述其高端包装设计方案。背景: ${context}。${customInputs['packaging-design'] || ''} (要求：文字说明言简意赅，字数限制在500字以内)`, "You are a luxury packaging designer."),
          (content) => {
            setProject(prev => ({ ...prev, packagingDesign: [{ role: 'assistant', content }] }));
          }
        ),
        generatePackagingDesign(prompt, project.packagingReferenceImage)
      ]);

      if (imageUrl || textResult) {
        setProject(prev => ({ 
          ...prev, 
          packagingImage: imageUrl || prev.packagingImage,
          packagingDesign: [{ role: 'assistant', content: textResult }]
        }));
      }
    } catch (err) {
      setError('包装生成失败');
    } finally {
      setIsLocalLoading(prev => ({ ...prev, 'packaging-design': false }));
    }
  };

  const runProduction = async () => {
    setIsLocalLoading(prev => ({ ...prev, 'production-file': true }));
    try {
      const dielinePrompt = `A professional technical packaging dieline blueprint for a beauty product box (serum bottle size). Flat layout, white background, blue and red technical lines for cutting and folding. Include measurements, scale bars, and crop marks. High contrast, clean vector style, suitable for Adobe Illustrator reference. Brand: ${project.name}.`;

      setProject(prev => ({ ...prev, productionSpecs: '正在生成生产规范...' }));

      const [textResult, dielineUrl] = await Promise.all([
        handleStreamingResponse(
          generateProductionSpecsStream(project.name, (project.visualIdentity?.[project.visualIdentity.length - 1]?.content) || '标准高端美妆视觉系统'),
          (content) => {
            setProject(prev => ({ ...prev, productionSpecs: content }));
          }
        ),
        generatePackagingDesign(dielinePrompt)
      ]);

      setProject(prev => ({ 
        ...prev, 
        productionSpecs: textResult,
        productionDielineImage: dielineUrl || undefined
      }));
    } catch (err) {
      setError('生产文件生成失败');
    } finally {
      setIsLocalLoading(prev => ({ ...prev, 'production-file': false }));
    }
  };

  const runVideo = async () => {
    if (!hasKey) {
      setError('视频生成需要选择 API Key');
      return;
    }
    setIsLocalLoading(prev => ({ ...prev, 'marketing-video': true }));
    setLoadingMsg('正在准备视频生成...');
    try {
      const lastStory = project.brandStory?.[project.brandStory.length - 1]?.content || '优雅高端';
      const lastVI = project.visualIdentity?.[project.visualIdentity.length - 1]?.content || '粉紫渐变科技感';
      const context = `品牌故事: ${lastStory}, 视觉参考: ${lastVI}`;
      const prompt = `品牌 "${project.name}" 的产品推广视频。${context}。${customInputs['marketing-video'] ? `额外要求: ${customInputs['marketing-video']}` : ''}`;
      const videoUrl = await generateMarketingVideo(prompt, (msg) => setLoadingMsg(msg), project.marketingVideoReferenceImage);
      setProject(prev => ({ ...prev, marketingVideoUrl: videoUrl }));
    } catch (err) {
      setError('视频生成失败');
    } finally {
      setIsLocalLoading(prev => ({ ...prev, 'marketing-video': false }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'packagingReferenceImage' | 'marketingVideoReferenceImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProject(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const renderImageUpload = (field: 'packagingReferenceImage' | 'marketingVideoReferenceImage') => (
    <div className="space-y-3">
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-ink/30">
        参考图 (可选) / Reference Image (Optional)
      </label>
      <div className="flex items-center gap-4">
        {!project[field] ? (
          <label className="flex-1 border-2 border-dashed border-black/5 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-all group">
            <Upload className="w-8 h-8 text-brand-ink/20 group-hover:text-brand-primary/40 transition-colors mb-2" />
            <span className="text-xs font-bold text-brand-ink/40">点击或拖拽上传参考图</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, field)} />
          </label>
        ) : (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-black/5">
            <img src={project[field]} alt="Reference" className="w-full h-full object-cover" />
            <button 
              onClick={() => setProject(prev => ({ ...prev, [field]: undefined }))}
              className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const HistoryControls = ({ stage }: { stage: BrandStage }) => {
    const stageHistory = project.history[stage] || [];
    
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => startNewSession(stage)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-surface hover:bg-black/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-ink/40 transition-all border border-black/5 w-full"
          >
            <Plus className="w-3.5 h-3.5" /> 新建会话 / New Session
          </button>
          
          {stageHistory.length > 0 && (
            <button 
              onClick={() => setViewingHistory(stage)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-accent hover:bg-brand-accent/80 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary transition-all border border-brand-primary/10 w-full"
            >
              <HistoryIcon className="w-3.5 h-3.5" /> 历史记录 / History
            </button>
          )}
        </div>
        
        {stageHistory.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-ink/20 whitespace-nowrap">版本 / Versions:</span>
            {stageHistory.map((_, idx) => (
              <button
                key={idx}
                onClick={() => switchVersion(stage, idx)}
                className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap",
                  project.currentVersion[stage] === idx 
                    ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" 
                    : "bg-brand-surface text-brand-ink/40 hover:bg-black/5"
                )}
              >
                V{idx + 1}
              </button>
            ))}
            {project.currentVersion[stage] === undefined && (
              <div className="px-3 py-1 rounded-lg text-[10px] font-bold bg-brand-accent text-brand-primary border border-brand-primary/10">
                当前 / Current
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const LocalLoader = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4 brand-card border border-brand-primary/10">
      <div className="relative">
        <div className="w-12 h-12 border-2 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin" />
        <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-brand-primary animate-pulse" />
      </div>
      <p className="text-brand-ink/50 text-[10px] font-black tracking-[0.3em] uppercase">{message}</p>
    </div>
  );

  const MarketAnalysisResult = ({ messages }: { messages: ChatMessage[] }) => {
    const COLORS = ['#2D2B42', '#E8E6F4', '#4F46E5', '#818CF8', '#C7D2FE', '#1E1B4B'];

    return (
      <div className="space-y-8">
        {messages.map((msg, idx) => {
          const chartMatch = msg.content.match(/```chart-data\n([\s\S]*?)\n```/);
          const textContent = msg.content.replace(/```chart-data\n([\s\S]*?)\n```/, '');
          
          let chartData = null;
          if (chartMatch) {
            try {
              chartData = JSON.parse(chartMatch[1]);
            } catch (e) {
              console.error("Failed to parse chart data", e);
            }
          }

          return (
            <div key={idx} className={cn(
              "flex flex-col gap-4",
              msg.role === 'user' ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "max-w-[85%] p-8 rounded-[2rem]",
                msg.role === 'user' 
                  ? "bg-brand-accent text-brand-primary border border-brand-primary/5" 
                  : "brand-card markdown-body"
              )}>
                {msg.role === 'user' ? (
                  <p className="text-sm font-medium">{msg.content}</p>
                ) : (
                  <Markdown>{textContent}</Markdown>
                )}
              </div>

              {chartData && (
                <div className="brand-card p-10 space-y-6 w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-brand-ink/60">{chartData.title || '市场数据可视化'}</h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartData.type === 'pie' ? (
                        <PieChart>
                          <Pie
                            data={chartData.data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {chartData.data.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      ) : chartData.type === 'line' ? (
                        <LineChart data={chartData.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#2D2B42" strokeWidth={3} dot={{ r: 6, fill: '#2D2B42' }} />
                        </LineChart>
                      ) : (
                        <BarChart data={chartData.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip cursor={{ fill: 'rgba(45, 43, 66, 0.05)' }} />
                          <Bar dataKey="value" fill="#2D2B42" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const ChatHistory = ({ messages }: { messages: ChatMessage[] }) => (
    <div className="space-y-6">
      {messages.map((msg, idx) => (
        <div key={idx} className={cn(
          "flex flex-col gap-2",
          msg.role === 'user' ? "items-end" : "items-start"
        )}>
          <div className={cn(
            "max-w-[85%] p-8 rounded-[2rem]",
            msg.role === 'user' 
              ? "bg-brand-accent text-brand-primary border border-brand-primary/5" 
              : "brand-card markdown-body"
          )}>
            {msg.role === 'user' ? (
              <p className="text-sm font-medium">{msg.content}</p>
            ) : (
              <Markdown>{msg.content}</Markdown>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const HistoryView = ({ stage }: { stage: BrandStage }) => {
    const stageHistory = project.history[stage] || [];
    const stageLabel = STAGES.find(s => s.id === stage)?.label;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-12"
      >
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => setViewingHistory(null)}
            className="flex items-center gap-3 text-brand-ink/40 hover:text-brand-ink transition-colors font-black text-sm uppercase tracking-widest"
          >
            <ArrowLeft className="w-5 h-5" /> 返回 / Back
          </button>
          <div className="text-right">
            <h3 className="text-4xl font-bold mb-2 text-brand-primary tracking-tight">{stageLabel} 历史记录</h3>
            <p className="text-brand-ink/40 text-sm">共 {stageHistory.length} 个历史版本</p>
          </div>
        </div>

        <div className="space-y-24 pl-12 border-l border-black/5">
          {stageHistory.map((version, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[61px] top-0 w-6 h-6 rounded-full bg-white border-4 border-brand-primary shadow-lg flex items-center justify-center text-[10px] font-black">
                {idx + 1}
              </div>
              
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-brand-primary">Version {idx + 1}</span>
                  <span className="text-[10px] text-brand-ink/20 font-mono">{new Date(version.timestamp).toLocaleString()}</span>
                </div>

                <div className="opacity-80">
                  {stage === 'market-analysis' && version.marketAnalysis && <MarketAnalysisResult messages={version.marketAnalysis} />}
                  {stage === 'brand-story' && version.brandStory && <ChatHistory messages={version.brandStory} />}
                  {stage === 'formula-design' && version.formulaDesign && <ChatHistory messages={version.formulaDesign} />}
                  {stage === 'visual-identity' && version.visualIdentity && (
                    <div className="space-y-10">
                      {version.visualIdentityImage && (
                        <img src={version.visualIdentityImage} className="w-full rounded-[2.5rem] shadow-xl" />
                      )}
                      <ChatHistory messages={version.visualIdentity} />
                    </div>
                  )}
                  {stage === 'packaging-design' && version.packagingDesign && (
                    <div className="space-y-10">
                      <ChatHistory messages={version.packagingDesign} />
                      {version.packagingImage && (
                        <img src={version.packagingImage} className="w-full rounded-[2.5rem] shadow-xl" />
                      )}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => {
                    switchVersion(stage, idx);
                    setViewingHistory(null);
                  }}
                  className="px-6 py-3 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                >
                  恢复此版本 / Restore this version
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderRefinementInput = (stage: BrandStage | 'production-file') => (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-3 px-2">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-brand-ink/40">追问与补充 / Follow-up & Supplement</span>
      </div>
      <div className="flex gap-3 bg-brand-surface p-2 rounded-2xl border border-black/5 shadow-sm focus-within:ring-4 focus-within:ring-brand-primary/5 transition-all">
        <input 
          type="text"
          placeholder="对结果不满意？您可以继续追问，例如：'再补充一些关于环保的细节' 或 '针对Z世代再深入分析一下'..."
          className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-sm placeholder:text-brand-ink/30"
          value={refinementInputs[stage] || ''}
          onChange={e => setRefinementInputs(prev => ({ ...prev, [stage]: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleRefine(stage)}
        />
        <button 
          onClick={() => handleRefine(stage)}
          disabled={isLocalLoading[stage] || !refinementInputs[stage]}
          className="px-6 brand-button-primary shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 font-bold text-xs"
        >
          {isLocalLoading[stage] ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          发送
        </button>
      </div>
    </div>
  );

  const renderStageInput = (stage: BrandStage, label: string, runFn: () => void, imageField?: 'packagingReferenceImage' | 'marketingVideoReferenceImage') => (
    <div className="brand-card p-8 space-y-6">
      <div>
        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-ink/30 mb-3">{label}</label>
        <textarea 
          placeholder="输入您的具体需求或留空使用默认设置..."
          className="w-full bg-brand-surface border border-black/5 rounded-2xl px-6 py-4 h-24 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all resize-none text-sm"
          value={customInputs[stage] || ''}
          onChange={e => setCustomInputs(prev => ({ ...prev, [stage]: e.target.value }))}
        />
      </div>

      {imageField && renderImageUpload(imageField)}

      <button 
        onClick={runFn}
        disabled={isLocalLoading[stage]}
        className="w-full py-4 font-black flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 rounded-full"
        style={{ 
          backgroundColor: STAGES.find(s => s.id === stage)?.color,
          color: STAGES.find(s => s.id === stage)?.textColor
        }}
      >
        {isLocalLoading[stage] ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        生成方案
      </button>
    </div>
  );

  const renderNextStepButton = (nextStage: BrandStage, label: string) => {
    const nextStageInfo = STAGES.find(s => s.id === nextStage);
    return (
      <div className="mt-12 pt-8 border-t border-brand-ink/5 flex items-center justify-between">
        <HistoryControls stage={currentStage} />
        <button 
          onClick={() => setCurrentStage(nextStage)}
          className="flex items-center gap-4 px-8 py-4 rounded-2xl font-black text-lg group transition-all shadow-lg hover:scale-105 active:scale-95"
          style={{ 
            backgroundColor: nextStageInfo?.color,
            color: nextStageInfo?.textColor
          }}
        >
          {label} <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-brand-bg">
      {/* Sidebar / Bottom Nav */}
      <aside className="w-full md:w-80 border-t md:border-t-0 md:border-r flex flex-col bg-brand-surface order-last md:order-first z-30">
        <div className="hidden md:block p-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-brand-primary">AuraBeauty AI</h1>
          </div>
          <p className="text-[10px] text-brand-ink/40 uppercase tracking-[0.2em] font-bold">Beauty Tech Solution</p>
        </div>

        <nav className="flex flex-row md:flex-col px-2 md:px-4 py-2 md:py-0 space-x-1 md:space-x-0 md:space-y-1 overflow-x-auto md:overflow-x-visible no-scrollbar">
          {STAGES.map((stage) => (
            <button
              key={stage.id}
              onClick={() => setCurrentStage(stage.id)}
              className={cn(
                "flex-1 md:flex-none flex flex-col md:flex-row items-center md:items-start gap-1 md:gap-4 p-2 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 group relative overflow-hidden min-w-[70px] md:min-w-0",
                currentStage === stage.id 
                  ? "shadow-lg shadow-black/5" 
                  : "hover:bg-black/5 text-brand-ink/60"
              )}
              style={{ 
                backgroundColor: currentStage === stage.id ? stage.color : undefined,
                color: currentStage === stage.id ? stage.textColor : undefined
              }}
            >
              {currentStage === stage.id && (
                <motion.div 
                  layoutId="active-stage"
                  className="absolute inset-0 -z-10"
                  style={{ backgroundColor: stage.color }}
                />
              )}
              <div className={cn(
                "p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors",
                currentStage === stage.id ? "bg-white/40" : "bg-brand-ink/5 group-hover:bg-brand-ink/10"
              )}>
                {React.cloneElement(stage.icon as React.ReactElement, { className: "w-4 h-4 md:w-5 md:h-5" })}
              </div>
              <div className="text-center md:text-left">
                <p className="font-bold text-[10px] md:text-sm whitespace-nowrap">{stage.label}</p>
                <p className={cn(
                  "hidden md:block text-[10px] leading-tight mt-0.5 font-medium",
                  currentStage === stage.id ? "opacity-70" : "text-brand-ink/40"
                )}>
                  {stage.description}
                </p>
              </div>
            </button>
          ))}
        </nav>

        <div className="hidden md:block p-6 border-t border-black/5">
          {!hasKey && (
            <button 
              onClick={handleOpenKeySelector}
              className="w-full py-3 px-4 bg-brand-primary/10 text-brand-primary rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-brand-primary/20 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Configure API Key
            </button>
          )}
          {hasKey && (
            <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-wider px-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              AI Engine Ready
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-brand-bg no-scrollbar">
        <div className="max-w-4xl mx-auto py-10 md:py-20 px-6 md:px-12 pb-32 md:pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewingHistory ? `history-${viewingHistory}` : currentStage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {viewingHistory ? (
                <HistoryView stage={viewingHistory} />
              ) : (
                <>
                  {/* Header */}
                  <div className="mb-10 md:mb-16 relative">
                    <div className="flex items-center gap-4 mb-4 md:mb-6">
                      <div className="h-[1px] w-8 md:w-12" style={{ backgroundColor: STAGES.find(s => s.id === currentStage)?.color }} />
                      <span className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] font-black" style={{ color: STAGES.find(s => s.id === currentStage)?.textColor }}>
                        Phase {STAGES.findIndex(s => s.id === currentStage) + 1}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row items-start gap-4 md:gap-8">
                      <div 
                        className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-xl shrink-0"
                        style={{ 
                          backgroundColor: STAGES.find(s => s.id === currentStage)?.color,
                          color: STAGES.find(s => s.id === currentStage)?.textColor
                        }}
                      >
                        {STAGES.find(s => s.id === currentStage)?.icon && React.cloneElement(STAGES.find(s => s.id === currentStage)!.icon as React.ReactElement<any>, { 
                          className: "w-6 h-6 md:w-10 md:h-10"
                        })}
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-6xl font-bold mb-3 md:mb-6 tracking-tight text-brand-primary">
                          {STAGES.find(s => s.id === currentStage)?.label}
                        </h2>
                        <p className="text-brand-ink/50 text-sm md:text-xl max-w-2xl leading-relaxed font-light">
                          {STAGES.find(s => s.id === currentStage)?.description}。您可以直接输入需求生成，或基于前序步骤自动生成。
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stage Content */}
                  <div className="space-y-10">
                    {currentStage === 'market-analysis' && (
                      <div className="space-y-8">
                        {!project.marketAnalysis && !isLocalLoading['market-analysis'] && (
                          <div className="brand-card p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-end">
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-ink/30 mb-2 md:mb-3">品牌名称 / Brand Name</label>
                                <input
                                  type="text"
                                  placeholder="例如: Aura Glow"
                                  className="w-full bg-brand-surface border border-black/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all text-sm md:text-base"
                                  value={project.name}
                                  onChange={e => setProject(p => ({ ...p, name: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-ink/30 mb-2 md:mb-3">目标受众 / Target Audience</label>
                                <input
                                  type="text"
                                  placeholder="例如: 25-35岁都市女性"
                                  className="w-full bg-brand-surface border border-black/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all text-sm md:text-base"
                                  value={project.targetAudience}
                                  onChange={e => setProject(p => ({ ...p, targetAudience: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-ink/30 mb-2 md:mb-3">售卖渠道 / Sales Channels</label>
                                <input
                                  type="text"
                                  placeholder="例如: 抖音、小红书"
                                  className="w-full bg-brand-surface border border-black/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all text-sm md:text-base"
                                  value={project.salesChannels}
                                  onChange={e => setProject(p => ({ ...p, salesChannels: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-ink/30 mb-2 md:mb-3">售卖地区 / Sales Regions</label>
                                <input
                                  type="text"
                                  placeholder="例如: 中国大陆、东南亚"
                                  className="w-full bg-brand-surface border border-black/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all text-sm md:text-base"
                                  value={project.salesRegions}
                                  onChange={e => setProject(p => ({ ...p, salesRegions: e.target.value }))}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-ink/30 mb-3">解决的痛点 / Pain Points Solved</label>
                                <textarea
                                  placeholder="例如: 解决敏感肌用户在换季时的泛红脱皮问题，提供长效修护"
                                  className="w-full bg-brand-surface border border-black/5 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all text-sm md:text-base min-h-[100px]"
                                  value={project.painPoints}
                                  onChange={e => setProject(p => ({ ...p, painPoints: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-ink/30 mb-3">核心价值 / Core Values</label>
                                <input
                                  type="text"
                                  placeholder="例如: 纯净、科技、可持续"
                                  className="w-full bg-brand-surface border border-black/5 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all text-sm md:text-base"
                                  value={project.coreValues}
                                  onChange={e => setProject(p => ({ ...p, coreValues: e.target.value }))}
                                />
                              </div>
                            </div>
                        <button 
                          onClick={runAnalysis}
                          disabled={isLocalLoading['market-analysis']}
                          className="w-full py-5 brand-button-primary text-lg shadow-2xl shadow-brand-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {isLocalLoading['market-analysis'] ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                          启动全链路品牌孵化
                        </button>
                      </div>
                    )}
                        {(project.marketAnalysis || isLocalLoading['market-analysis']) && (
                          <div className="space-y-10">
                            <HistoryControls stage="market-analysis" />
                            {isLocalLoading['market-analysis'] && !project.marketAnalysis && <LocalLoader message="正在分析市场动态..." />}
                            {project.marketAnalysis && <MarketAnalysisResult messages={project.marketAnalysis} />}
                            {renderRefinementInput('market-analysis')}
                            {renderNextStepButton('brand-story', '下一步：构建品牌故事')}
                          </div>
                        )}
                  </div>
                )}

                {currentStage === 'brand-story' && (
                  <div className="space-y-8">
                    {!project.brandStory && !isLocalLoading['brand-story'] && renderStageInput('brand-story', '品牌故事需求', runStorytelling)}
                    {(project.brandStory || isLocalLoading['brand-story']) && (
                      <div className="space-y-10">
                        <HistoryControls stage="brand-story" />
                        {isLocalLoading['brand-story'] && !project.brandStory && <LocalLoader message="正在构思品牌故事..." />}
                        {project.brandStory && <ChatHistory messages={project.brandStory} />}
                        {renderRefinementInput('brand-story')}
                        {renderNextStepButton('formula-design', '下一步：配方设计')}
                      </div>
                    )}
                  </div>
                )}

                {currentStage === 'formula-design' && (
                  <div className="space-y-8">
                    {!project.formulaDesign && !isLocalLoading['formula-design'] && renderStageInput('formula-design', '配方场景与需求描述', runFormulaDesign)}
                    {(project.formulaDesign || isLocalLoading['formula-design']) && (
                      <div className="space-y-10">
                        <HistoryControls stage="formula-design" />
                        {isLocalLoading['formula-design'] && !project.formulaDesign && <LocalLoader message="正在研发配方..." />}
                        {project.formulaDesign && <ChatHistory messages={project.formulaDesign} />}
                        {renderRefinementInput('formula-design')}
                        {renderNextStepButton('visual-identity', '下一步：定义视觉识别')}
                      </div>
                    )}
                  </div>
                )}

                {currentStage === 'visual-identity' && (
                  <div className="space-y-8">
                    {!project.visualIdentity && !isLocalLoading['visual-identity'] && renderStageInput('visual-identity', '视觉设计需求', runVisualIdentity)}
                    {(project.visualIdentity || isLocalLoading['visual-identity']) && (
                      <div className="space-y-10">
                        <HistoryControls stage="visual-identity" />
                        {isLocalLoading['visual-identity'] && !project.visualIdentity && <LocalLoader message="正在设计视觉系统..." />}
                        {project.visualIdentityImage && (
                          <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl">
                            <img 
                              src={project.visualIdentityImage} 
                              alt="Visual Identity Moodboard" 
                              className="w-full transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-brand-primary">
                              视觉概念图 / Visual Concept
                            </div>
                          </div>
                        )}
                        {project.visualIdentity && <ChatHistory messages={project.visualIdentity} />}
                        {renderRefinementInput('visual-identity')}
                        {renderNextStepButton('packaging-design', '下一步：包装设计渲染')}
                      </div>
                    )}
                  </div>
                )}

                {currentStage === 'packaging-design' && (
                  <div className="space-y-8">
                    {!project.packagingDesign && !isLocalLoading['packaging-design'] && renderStageInput('packaging-design', '包装设计需求', runPackaging, 'packagingReferenceImage')}
                    {(project.packagingDesign || isLocalLoading['packaging-design']) && (
                      <div className="space-y-10">
                        <HistoryControls stage="packaging-design" />
                        {isLocalLoading['packaging-design'] && !project.packagingDesign && <LocalLoader message="正在设计包装方案..." />}
                        {project.packagingDesign && <ChatHistory messages={project.packagingDesign} />}
                        
                        {project.packagingImage && (
                          <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl">
                            <img 
                              src={project.packagingImage} 
                              alt="Packaging Design" 
                              className="w-full transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-brand-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                onClick={runPackaging}
                                className="px-8 py-3 bg-white text-brand-primary rounded-full font-black text-sm shadow-xl"
                              >
                                重新生成渲染图
                              </button>
                            </div>
                          </div>
                        )}

                        {renderRefinementInput('packaging-design')}
                        
                        {/* Production Specs Section within Packaging */}
                        <div className="space-y-6">
                          {(!project.productionSpecs && !isLocalLoading['production-file']) ? (
                            <div className="brand-card p-8 flex flex-col items-center text-center">
                              <Printer className="w-12 h-12 text-brand-primary/40 mb-4" />
                              <h3 className="text-xl font-bold mb-2 text-brand-primary">对设计方案满意？</h3>
                              <p className="text-brand-ink/40 text-sm mb-6">一键生成可直接交付工厂的印刷生产技术规范文件</p>
                              <button 
                                onClick={runProduction}
                                className="px-10 py-4 brand-button-primary font-black shadow-lg flex items-center gap-2"
                              >
                                <Printer className="w-5 h-5" />
                                生成落地生产文件
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="flex items-center gap-4">
                                <div className="h-[1px] flex-1 bg-brand-primary/20" />
                                <span className="text-[10px] uppercase tracking-widest font-black text-brand-primary">落地生产规范与技术图纸 / Production Specs & Dieline</span>
                                <div className="h-[1px] flex-1 bg-brand-primary/20" />
                              </div>

                              {isLocalLoading['production-file'] && !project.productionSpecs && <LocalLoader message="正在生成生产规范..." />}

                              {project.productionDielineImage && (
                                <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl bg-white p-8 border border-black/5">
                                  <img 
                                    src={project.productionDielineImage} 
                                    alt="Technical Dieline" 
                                    className="w-full h-auto object-contain"
                                  />
                                  <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-brand-primary">
                                    技术刀版图 / Technical Dieline
                                  </div>
                                  <div className="absolute bottom-6 right-6">
                                    <a 
                                      href={project.productionDielineImage} 
                                      download={`${project.name}_Dieline.png`}
                                      className="p-3 bg-brand-surface hover:bg-black/5 rounded-xl transition-colors flex items-center gap-2 text-brand-ink text-[10px] font-bold uppercase tracking-wider"
                                    >
                                      <Download className="w-4 h-4" /> 下载图纸
                                    </a>
                                  </div>
                                </div>
                              )}

                              {project.productionSpecs && (
                                <div className="brand-card p-10 markdown-body relative">
                                  <div className="absolute top-8 right-8 flex gap-3">
                                    <button 
                                      onClick={() => {
                                        const blob = new Blob([project.productionSpecs || ''], { type: 'text/plain' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${project.name}_Production_Specs_Adobe_Guide.txt`;
                                        a.click();
                                      }}
                                      className="p-3 bg-brand-accent hover:bg-brand-accent/80 rounded-xl transition-colors flex items-center gap-2 text-brand-primary text-xs font-bold"
                                    >
                                      <Download className="w-4 h-4" /> 下载 Adobe 规范
                                    </button>
                                  </div>
                                  <Markdown>{project.productionSpecs}</Markdown>
                                </div>
                              )}
                              {project.productionSpecs && renderRefinementInput('production-file')}
                            </div>
                          )}
                        </div>

                        {renderNextStepButton('marketing-video', '下一步：生成营销视频')}
                      </div>
                    )}
                  </div>
                )}

                {currentStage === 'marketing-video' && (
                  <div className="space-y-8">
                    {!project.marketingVideoUrl && !isLocalLoading['marketing-video'] && renderStageInput('marketing-video', '视频脚本需求', runVideo, 'marketingVideoReferenceImage')}
                    {(project.marketingVideoUrl || isLocalLoading['marketing-video']) && (
                      <div className="space-y-10">
                        {isLocalLoading['marketing-video'] && !project.marketingVideoUrl && <LocalLoader message={loadingMsg || "正在生成营销视频..."} />}
                        {project.marketingVideoUrl && (
                          <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-black">
                            <video 
                              src={project.marketingVideoUrl} 
                              controls 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {project.marketingVideoUrl && (
                          <div className="flex gap-6">
                            <button 
                              onClick={runVideo}
                              className="px-10 py-4 brand-button-primary font-black shadow-xl"
                            >
                              重新生成视频
                            </button>
                            <a 
                              href={project.marketingVideoUrl} 
                              download="marketing-video.mp4"
                              className="px-10 py-4 brand-button-secondary text-brand-primary font-black flex items-center gap-2"
                            >
                              <Download className="w-5 h-5" /> 下载视频
                            </a>
                          </div>
                        )}
                        {project.marketingVideoUrl && renderStageInput('marketing-video', '修改视频需求', runVideo, 'marketingVideoReferenceImage')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>

        {/* Global Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center"
            >
              <div className="relative">
                <div className="w-32 h-32 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-brand-primary animate-pulse" />
              </div>
              <p className="mt-10 text-brand-primary font-bold text-2xl tracking-tight">{loadingMsg}</p>
              <p className="mt-3 text-brand-ink/30 text-[10px] font-black tracking-[0.4em] uppercase">AuraBeauty AI Engine</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Toast */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-12 right-12 bg-red-500 text-white px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 z-50"
            >
              <AlertCircle className="w-6 h-6" />
              <span className="font-bold">{error}</span>
              <button onClick={() => setError(null)} className="ml-6 text-white/60 hover:text-white">✕</button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
