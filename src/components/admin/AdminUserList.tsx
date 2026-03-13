import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Trash2, Edit2, Eye, ChevronLeft, ChevronRight, KeyRound, X, Loader2 } from 'lucide-react';
import { fetchUsers, createUser, deleteUser, AdminUser, UserListResponse } from '../../services/admin-api';

export default function AdminUserList() {
  const navigate = useNavigate();
  const [data, setData] = useState<UserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchUsers(page, 20, search);
      setData(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      alert(e.message);
    }
    setDeleting(false);
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-[#1a1a1a]">用户管理</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-xs font-bold hover:bg-[#333] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          新增用户
        </button>
      </div>

      {/* 搜索 */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaa]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索手机号或昵称..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40"
          />
        </div>
      </form>

      {/* 表格 */}
      <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-[#FAFAF9]">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#888]">手机号</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#888]">昵称</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#888]">角色</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#888]">API Key</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#888]">消息数</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#888]">注册时间</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#888]">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[#aaa]">加载中...</td></tr>
              ) : !data?.users.length ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[#aaa]">暂无用户</td></tr>
              ) : data.users.map(u => (
                <tr key={u.id} className="border-b border-black/5 hover:bg-[#FAFAF9] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">{u.phone}</td>
                  <td className="px-4 py-3 text-[#555]">{u.displayName || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'admin' ? 'bg-[#C9A96E]/20 text-[#8B6914]' : 'bg-black/5 text-[#888]'
                    }`}>
                      {u.role === 'admin' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block w-2 h-2 rounded-full ${u.hasApiKey ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                  </td>
                  <td className="px-4 py-3 text-[#555]">{u.messageCount}</td>
                  <td className="px-4 py-3 text-[#888] text-xs">{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/users/${u.id}`)}
                        className="p-1.5 rounded hover:bg-black/5 text-[#888] hover:text-[#1a1a1a] transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="p-1.5 rounded hover:bg-red-50 text-[#888] hover:text-red-500 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-black/5">
            <span className="text-xs text-[#888]">共 {data?.total} 条</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded hover:bg-black/5 disabled:opacity-30 text-[#888]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-[#555]">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded hover:bg-black/5 disabled:opacity-30 text-[#888]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-sm font-bold text-[#1a1a1a] mb-2">确认删除</h3>
            <p className="text-xs text-[#666] mb-6">
              确定要删除用户 <strong>{deleteTarget.phone}</strong> 吗？此操作不可撤销，该用户的所有数据将被永久删除。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-black/10 text-xs font-bold text-[#555] hover:bg-black/5 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增用户弹窗 */}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone.trim() || !password || password.length < 6) {
      setError('手机号和密码（至少6位）必填');
      return;
    }
    setLoading(true);
    try {
      await createUser({ phone: phone.trim(), password, displayName: displayName.trim() || undefined, role });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-[#1a1a1a]">新增用户</h3>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-lg"><X className="w-4 h-4 text-[#888]" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="手机号"
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#FAFAF9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40"
          />
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="昵称（可选）"
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#FAFAF9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="密码（至少6位）"
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#FAFAF9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#FAFAF9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40"
          >
            <option value="user">普通用户</option>
            <option value="admin">管理员</option>
          </select>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-black/10 text-xs font-bold text-[#555] hover:bg-black/5">取消</button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-xs font-bold hover:bg-[#333] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
