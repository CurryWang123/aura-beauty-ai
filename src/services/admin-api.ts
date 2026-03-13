import { getSession } from '../utils/storage';

function authHeaders(): Record<string, string> {
  const session = getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.token || ''}`,
  };
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

// 用户列表
export interface AdminUser {
  id: string;
  phone: string;
  displayName: string;
  role: string;
  createdAt: string;
  messageCount: number;
  hasApiKey: boolean;
}

export interface UserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export function fetchUsers(page = 1, pageSize = 20, search = ''): Promise<UserListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set('search', search);
  return request(`/api/admin/users?${params}`);
}

// 用户详情
export interface UserDetail {
  id: string;
  phone: string;
  displayName: string;
  role: string;
  createdAt: string;
  apiKeys: {
    doubaoApiKey: string;
    geminiApiKey: string;
    openaiApiKey: string;
    updatedAt: string;
  } | null;
  messageStats: { stage: string; count: number }[];
}

export function fetchUserDetail(id: string): Promise<UserDetail> {
  return request(`/api/admin/users/${id}`);
}

// 新增用户
export function createUser(data: { phone: string; password: string; displayName?: string; role?: string }) {
  return request('/api/admin/users', { method: 'POST', body: JSON.stringify(data) });
}

// 编辑用户
export function updateUser(id: string, data: { phone?: string; displayName?: string; role?: string; password?: string }) {
  return request(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// 删除用户
export function deleteUser(id: string) {
  return request(`/api/admin/users/${id}`, { method: 'DELETE' });
}

// 用户消息
export interface UserMessages {
  messages: Record<string, { role: string; content: string; index: number; createdAt: string }[]>;
}

export function fetchUserMessages(id: string): Promise<UserMessages> {
  return request(`/api/admin/users/${id}/messages`);
}

export function fetchUserStageMessages(id: string, stage: string) {
  return request<{ stage: string; messages: { role: string; content: string; index: number; createdAt: string }[] }>(
    `/api/admin/users/${id}/messages/${stage}`
  );
}

// 统计
export interface AdminStats {
  totalUsers: number;
  totalMessages: number;
  todayUsers: number;
  todayMessages: number;
  stageDistribution: { stage: string; count: number }[];
  userTrend: { date: string; count: number }[];
  messageTrend: { date: string; count: number }[];
  topUsers: { id: string; phone: string; displayName: string; messageCount: number }[];
}

export function fetchStats(): Promise<AdminStats> {
  return request('/api/admin/stats');
}
