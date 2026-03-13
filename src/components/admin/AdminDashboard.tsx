import React, { useEffect, useState } from 'react';
import { Users, MessageSquare, UserPlus, MessageCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { fetchStats, AdminStats } from '../../services/admin-api';

const STAGE_LABELS: Record<string, string> = {
  'market-analysis': '市场分析',
  'brand-story': '品牌故事',
  'formula-design': '配方设计',
  'visual-identity': '视觉识别',
  'packaging-design': '包装设计',
  'marketing-video': '营销短视频',
};

const PIE_COLORS = ['#C9A96E', '#98FFD9', '#C5B4FF', '#FFD6FF', '#FFF2B2', '#B2EBF2'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
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

  const cards = [
    { label: '总用户', value: stats.totalUsers, icon: Users, color: '#C9A96E' },
    { label: '总消息', value: stats.totalMessages, icon: MessageSquare, color: '#98FFD9' },
    { label: '今日新增用户', value: stats.todayUsers, icon: UserPlus, color: '#C5B4FF' },
    { label: '今日消息', value: stats.todayMessages, icon: MessageCircle, color: '#FFD6FF' },
  ];

  // 合并趋势数据
  const trendDates = new Set([
    ...stats.userTrend.map(d => d.date),
    ...stats.messageTrend.map(d => d.date),
  ]);
  const trendData = Array.from(trendDates).sort().map(date => ({
    date: date.slice(5, 10),
    users: stats.userTrend.find(d => d.date === date)?.count || 0,
    messages: stats.messageTrend.find(d => d.date === date)?.count || 0,
  }));

  const pieData = stats.stageDistribution.map(d => ({
    name: STAGE_LABELS[d.stage] || d.stage,
    value: d.count,
  }));

  return (
    <div>
      <h1 className="text-lg font-bold text-[#1a1a1a] mb-6">仪表盘</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-xl p-5 border border-black/5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#888]">{card.label}</span>
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
            </div>
            <div className="text-2xl font-black text-[#1a1a1a]">{card.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 趋势折线图 */}
        <div className="bg-white rounded-xl p-5 border border-black/5 shadow-sm">
          <h2 className="text-xs font-bold text-[#1a1a1a] mb-4">7 天趋势</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="users" name="新增用户" stroke="#C9A96E" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="messages" name="消息数" stroke="#C5B4FF" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 阶段分布饼图 */}
        <div className="bg-white rounded-xl p-5 border border-black/5 shadow-sm">
          <h2 className="text-xs font-bold text-[#1a1a1a] mb-4">各阶段消息分布</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[260px] text-sm text-[#bbb]">暂无数据</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#ccc' }} style={{ fontSize: 10 }}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
