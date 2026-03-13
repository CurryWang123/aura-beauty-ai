import React from 'react';
import Markdown from 'react-markdown';

interface Message {
  role: string;
  content: string;
  index: number;
  createdAt: string;
}

interface Props {
  messages: Message[];
  stage: string;
}

const STAGE_LABELS: Record<string, string> = {
  'market-analysis': '市场分析',
  'brand-story': '品牌故事',
  'formula-design': '配方设计',
  'visual-identity': '视觉识别',
  'packaging-design': '包装设计',
  'marketing-video': '营销短视频',
};

export default function AdminChatViewer({ messages, stage }: Props) {
  if (!messages || messages.length === 0) {
    return <div className="text-center text-sm text-[#bbb] py-12">该阶段暂无消息</div>;
  }

  return (
    <div>
      <h3 className="text-xs font-bold text-[#888] mb-4 uppercase tracking-wider">
        {STAGE_LABELS[stage] || stage} - {messages.length} 条消息
      </h3>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-[#1a1a1a] text-white rounded-br-md'
                  : 'bg-white border border-black/5 text-[#333] rounded-bl-md'
              }`}
            >
              <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
                <Markdown>{msg.content}</Markdown>
              </div>
              <div className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-white/40' : 'text-[#bbb]'}`}>
                {msg.role === 'user' ? '用户' : 'AI'} · {new Date(msg.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
