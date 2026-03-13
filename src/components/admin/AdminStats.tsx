import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { fetchStats, AdminStats as StatsType } from '../../services/admin-api';

const STAGE_LABELS: Record<string, string> = {
  'market-analysis': '市场分析',
  'brand-story': '品牌故事',
  'formula-design': '配方设计',
  'visual-identity': '视觉识别',
  'packaging-design': '包装设计',
  'marketing-video': '营销短视频',
};

export default function AdminStats() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-sm text-[#888]">加载中...</div>;
  }

  if (!stats) {
    return <div className="text-sm text-red-500">加载统计数据失败</div>;
  }

  // 合并趋势
  const trendDates = new Set([
    ...stats.userTrend.map(d => d.date),
    ...stats.messageTrend.map(d => d.date),
  ]);
  const trendData = Array.from(trendDates).sort().map(date => ({
    date: date.slice(5, 10),
    users: stats.userTrend.find(d => d.date === date)?.count || 0,
    messages: stats.messageTrend.find(d => d.date === date)?.count || 0,
  }));

  const stageData = stats.stageDistribution.map(d => ({
    name: STAGE_LABELS[d.stage] || d.stage,
    count: d.count,
  }));

  return (
    <div>
      <h1 className="text-lg font-bold text-[#1a1a1a] mb-6">数据报表</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 用户增长曲线 */}
        <div className="bg-white rounded-xl p-5 border border-black/5 shadow-sm">
          <h2 className="text-xs font-bold text-[#1a1a1a] mb-4">用户注册趋势（7天）</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="users" name="新增用户" stroke="#C9A96E" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 消息趋势 */}
        <div className="bg-white rounded-xl p-5 border border-black/5 shadow-sm">
          <h2 className="text-xs font-bold text-[#1a1a1a] mb-4">消息趋势（7天）</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="messages" name="消息数" stroke="#C5B4FF" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 阶段分布 */}
        <div className="bg-white rounded-xl p-5 border border-black/5 shadow-sm">
          <h2 className="text-xs font-bold text-[#1a1a1a] mb-4">各阶段消息数量</h2>
          {stageData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-sm text-[#bbb]">暂无数据</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" name="消息数" fill="#C9A96E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 活跃用户 Top 10 */}
        <div className="bg-white rounded-xl p-5 border border-black/5 shadow-sm">
          <h2 className="text-xs font-bold text-[#1a1a1a] mb-4">活跃用户 Top 10</h2>
          {stats.topUsers.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-sm text-[#bbb]">暂无数据</div>
          ) : (
            <div className="space-y-2">
              {stats.topUsers.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#FAFAF9] transition-colors">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i < 3 ? 'bg-[#C9A96E]/20 text-[#8B6914]' : 'bg-black/5 text-[#888]'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1a1a1a] truncate">
                      {u.displayName || u.phone}
                    </p>
                    <p className="text-[10px] text-[#aaa]">{u.phone}</p>
                  </div>
                  <span className="text-xs font-bold text-[#C9A96E]">{u.messageCount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
