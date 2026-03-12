import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, KeyRound, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onClose: () => void;
}

export default function ApiKeyModal({ onClose }: Props) {
  const { getMyApiKeys, updateApiKeys } = useAuth();
  const [doubaoKey, setDoubaoKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showDoubao, setShowDoubao] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const keys = getMyApiKeys();
    if (keys) {
      setDoubaoKey(keys.doubaoApiKey || '');
      setGeminiKey(keys.geminiApiKey || '');
    }
  }, [getMyApiKeys]);

  const handleSave = async () => {
    setLoading(true);
    updateApiKeys({
      doubaoApiKey: doubaoKey.trim(),
      geminiApiKey: geminiKey.trim(),
      openaiApiKey: '',
    });
    setSaved(true);
    setLoading(false);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-black/5 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 text-[#C9A96E]" />
            <span className="text-sm font-bold text-[#1a1a1a]">配置 API Key</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-black/5 rounded-lg transition-colors">
            <X className="w-4 h-4 text-[#888]" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 豆包 API Key */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
              豆包（火山引擎）API Key
            </label>
            <div className="relative">
              <input
                type={showDoubao ? 'text' : 'password'}
                value={doubaoKey}
                onChange={e => setDoubaoKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-3 pr-10 rounded-xl border border-black/10 bg-[#FAFAF9] text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40 focus:border-[#C9A96E] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowDoubao(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] transition-colors"
              >
                {showDoubao ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-[#aaa] mt-1">用于文本生成、图片生成、视频生成</p>
          </div>

          {/* Gemini API Key */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
              Gemini API Key（可选）
            </label>
            <div className="relative">
              <input
                type={showGemini ? 'text' : 'password'}
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full px-4 py-3 pr-10 rounded-xl border border-black/10 bg-[#FAFAF9] text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40 focus:border-[#C9A96E] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowGemini(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] transition-colors"
              >
                {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-black/10 text-xs font-bold uppercase tracking-wider text-[#555] hover:bg-black/5 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saved}
            className="flex-1 py-3 bg-[#1a1a1a] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#333] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            {saved ? '已保存' : '保存'}
          </button>
        </div>

        <p className="text-[10px] text-[#bbb] text-center mt-4">
          API Key 仅存储在本地，不会上传至任何服务器
        </p>
      </div>
    </div>
  );
}
