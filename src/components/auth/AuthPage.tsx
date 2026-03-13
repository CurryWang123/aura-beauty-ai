import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Tab = 'login' | 'register';

const PHONE_REGEX = /^1[3-9]\d{9}$/;

export default function AuthPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedPhone = phone.trim();
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setError('请输入有效的手机号');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        await login(trimmedPhone, password);
      } else {
        await register(trimmedPhone, password, displayName.trim() || undefined);
      }
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0EB] flex items-start sm:items-center justify-center px-4 py-10 overflow-y-auto">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <Sparkles className="w-7 h-7 text-[#C9A96E]" />
            <span className="text-2xl font-black tracking-tight text-[#1a1a1a]">JUE BEAUTY AI</span>
          </div>
          <p className="text-xs text-[#888] tracking-widest uppercase">智能美妆品牌创作平台</p>
        </div>

        {/* 卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 sm:p-8">
          {/* Tab */}
          <div className="flex rounded-xl bg-[#F5F0EB] p-1 mb-6">
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                  tab === t
                    ? 'bg-white text-[#1a1a1a] shadow-sm'
                    : 'text-[#888] hover:text-[#555]'
                }`}
              >
                {t === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                手机号
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="请输入手机号"
                required
                maxLength={11}
                autoComplete="tel"
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#FAFAF9] text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40 focus:border-[#C9A96E] transition-all"
              />
            </div>

            {tab === 'register' && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                  显示名称（可选）
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="您的昵称"
                  autoComplete="name"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#FAFAF9] text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40 focus:border-[#C9A96E] transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                密码{tab === 'register' && <span className="normal-case font-normal ml-1">（至少 6 位）</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#FAFAF9] text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40 focus:border-[#C9A96E] transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1a1a1a] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {tab === 'login' ? '登录' : '创建账号'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
