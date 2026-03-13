import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, MessageSquare, User, Loader2, Save } from 'lucide-react';
import { fetchUserDetail, fetchUserMessages, updateUser, UserDetail, UserMessages } from '../../services/admin-api';
import AdminChatViewer from './AdminChatViewer';

const STAGES = [
  { id: 'market-analysis', label: '市场分析' },
  { id: 'brand-story', label: '品牌故事' },
  { id: 'formula-design', label: '配方设计' },
  { id: 'visual-identity', label: '视觉识别' },
  { id: 'packaging-design', label: '包装设计' },
  { id: 'marketing-video', label: '营销短视频' },
];

type Tab = 'info' | 'api-keys' | 'messages';

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [messages, setMessages] = useState<UserMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('info');
  const [activeStage, setActiveStage] = useState('market-analysis');

  // 编辑状态
  const [editPhone, setEditPhone] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchUserDetail(id),
      fetchUserMessages(id),
    ]).then(([u, m]) => {
      setUser(u);
      setMessages(m);
      setEditPhone(u.phone);
      setEditName(u.displayName);
      setEditRole(u.role);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const payload: any = { phone: editPhone, displayName: editName, role: editRole };
      if (editPassword) payload.password = editPassword;
      await updateUser(id, payload);
      setSaveMsg('保存成功');
      setEditPassword('');
      // 刷新
      const u = await fetchUserDetail(id);
      setUser(u);
    } catch (e: any) {
      setSaveMsg(e.message);
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-sm text-[#888]">加载中...</div>;
  }

  if (!user) {
    return <div className="text-sm text-red-500">用户不存在</div>;
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'info', label: '基本信息', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'api-keys', label: 'API Keys', icon: <KeyRound className="w-3.5 h-3.5" /> },
    { id: 'messages', label: '聊天记录', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ];

  return (
    <div>
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-xs text-[#888] hover:text-[#1a1a1a] transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        返回用户列表
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-lg font-bold text-[#1a1a1a]">{user.phone}</h1>
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
          user.role === 'admin' ? 'bg-[#C9A96E]/20 text-[#8B6914]' : 'bg-black/5 text-[#888]'
        }`}>
          {user.role === 'admin' ? '管理员' : '用户'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#F5F0EB] rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === t.id ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#888] hover:text-[#555]'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="bg-white rounded-xl border border-black/5 shadow-sm p-6">
        {tab === 'info' && (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">手机号</label>
              <input
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#FAFAF9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">昵称</label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#FAFAF9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">角色</label>
              <select
                value={editRole}
                onChange={e => setEditRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#FAFAF9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40"
              >
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                重置密码<span className="normal-case font-normal ml-1">（留空不修改）</span>
              </label>
              <input
                type="password"
                value={editPassword}
                onChange={e => setEditPassword(e.target.value)}
                placeholder="输入新密码..."
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#FAFAF9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">注册时间</label>
              <p className="text-sm text-[#555]">{new Date(user.createdAt).toLocaleString('zh-CN')}</p>
            </div>
            {saveMsg && <p className={`text-xs ${saveMsg === '保存成功' ? 'text-emerald-500' : 'text-red-500'}`}>{saveMsg}</p>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-xs font-bold hover:bg-[#333] disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              保存修改
            </button>
          </div>
        )}

        {tab === 'api-keys' && (
          <div>
            {!user.apiKeys ? (
              <p className="text-sm text-[#bbb]">该用户尚未配置 API Keys</p>
            ) : (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">豆包 API Key</label>
                  <p className="text-sm text-[#555] font-mono bg-[#FAFAF9] px-4 py-2.5 rounded-xl border border-black/10">
                    {user.apiKeys.doubaoApiKey || <span className="text-[#ccc]">未配置</span>}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">Gemini API Key</label>
                  <p className="text-sm text-[#555] font-mono bg-[#FAFAF9] px-4 py-2.5 rounded-xl border border-black/10">
                    {user.apiKeys.geminiApiKey || <span className="text-[#ccc]">未配置</span>}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">OpenAI API Key</label>
                  <p className="text-sm text-[#555] font-mono bg-[#FAFAF9] px-4 py-2.5 rounded-xl border border-black/10">
                    {user.apiKeys.openaiApiKey || <span className="text-[#ccc]">未配置</span>}
                  </p>
                </div>
                <p className="text-[10px] text-[#bbb]">
                  更新于 {new Date(user.apiKeys.updatedAt).toLocaleString('zh-CN')}
                </p>
              </div>
            )}
          </div>
        )}

        {tab === 'messages' && (
          <div className="flex gap-6">
            {/* 左侧阶段列表 */}
            <div className="w-36 shrink-0 space-y-1">
              {STAGES.map(s => {
                const count = messages?.messages[s.id]?.length || 0;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStage(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      activeStage === s.id
                        ? 'bg-[#1a1a1a] text-white'
                        : 'text-[#888] hover:bg-black/5'
                    }`}
                  >
                    {s.label}
                    {count > 0 && (
                      <span className={`ml-1.5 text-[10px] ${
                        activeStage === s.id ? 'text-white/60' : 'text-[#bbb]'
                      }`}>
                        ({count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 右侧消息 */}
            <div className="flex-1 min-w-0">
              <AdminChatViewer
                stage={activeStage}
                messages={messages?.messages[activeStage] || []}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
