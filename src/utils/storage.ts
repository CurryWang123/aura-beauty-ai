/**
 * localStorage 读写封装，提供类型安全 CRUD
 */

export interface StoredUser {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string; // "salt:hash"
  createdAt: number;
}

export interface SessionData {
  userId: string;
  username: string;
  loginAt: number;
}

export interface ApiKeys {
  doubaoApiKey: string;
  geminiApiKey: string;
  openaiApiKey: string;
  updatedAt: number;
}

// ===== 用户管理 =====

const USERS_KEY = 'jue-beauty-users';

export function getUsers(): Record<string, StoredUser> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUser(user: StoredUser): void {
  const users = getUsers();
  users[user.id] = user;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByUsername(username: string): StoredUser | null {
  const users = getUsers();
  return Object.values(users).find(u => u.username === username) ?? null;
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
