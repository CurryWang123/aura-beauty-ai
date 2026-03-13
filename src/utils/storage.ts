/**
 * localStorage 读写封装，提供类型安全 CRUD
 */

export interface SessionData {
  userId: string;
  phone: string;
  displayName: string;
  token: string;
  loginAt: number;
  role: string;
}

export interface ApiKeys {
  doubaoApiKey: string;
  geminiApiKey: string;
  openaiApiKey: string;
  updatedAt: number;
}

// ===== Session 管理 =====

const SESSION_KEY = 'jue-beauty-session';

export function getSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: SessionData): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ===== API Keys 管理 =====

function apiKeysKey(userId: string): string {
  return `jue-beauty-api-keys-${userId}`;
}

export function getApiKeys(userId: string): ApiKeys | null {
  try {
    const raw = localStorage.getItem(apiKeysKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveApiKeys(userId: string, keys: Omit<ApiKeys, 'updatedAt'>): void {
  const data: ApiKeys = { ...keys, updatedAt: Date.now() };
  localStorage.setItem(apiKeysKey(userId), JSON.stringify(data));
}

// ===== Project Storage Key =====

export function projectStorageKey(userId: string): string {
  return `aura-beauty-project-${userId}`;
}
