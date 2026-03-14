import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  SessionData,
  ApiKeys,
  getSession,
  saveSession,
  clearSession,
  getApiKeys,
  saveApiKeys,
} from '../utils/storage';
import { resetTextStreamAdapter } from '../services/ai';

interface AuthContextValue {
  user: SessionData | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<string>;
  register: (phone: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  updateApiKeys: (keys: Omit<ApiKeys, 'updatedAt'>) => void;
  getMyApiKeys: () => ApiKeys | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function injectApiKeys(userId: string): void {
  const keys = getApiKeys(userId);
  (window as any).__jubeauty_api_keys__ = {
    doubaoApiKey: keys?.doubaoApiKey || '',
    geminiApiKey: keys?.geminiApiKey || '',
    openaiApiKey: keys?.openaiApiKey || '',
  };
}

function clearInjectedApiKeys(): void {
  delete (window as any).__jubeauty_api_keys__;
}

async function syncApiKeysToServer(token: string, keys: Omit<ApiKeys, 'updatedAt'>): Promise<void> {
  try {
    await fetch('/api/user/api-keys', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(keys),
    });
  } catch {
    // 静默失败
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 启动时恢复 session，并从后端刷新 role
  useEffect(() => {
    const session = getSession();
    if (session?.token) {
      injectApiKeys(session.userId);
      // 先用本地 session 恢复，再从后端刷新 role
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${session.token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.userId) {
            const refreshed = { ...session, role: data.role || 'user' };
            saveSession(refreshed);
            setUser(refreshed);
          } else {
            // token 失效
            clearSession();
            setUser(null);
          }
        })
        .catch(() => {
          // 网络错误时使用本地 session
          setUser(session);
        })
        .finally(() => setIsLoading(false));
    } else {
      clearSession();
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (phone: string, password: string): Promise<string> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '登录失败');

    const session: SessionData = {
      userId: data.user.userId,
      phone: data.user.phone,
      displayName: data.user.displayName,
      token: data.token,
      loginAt: Date.now(),
      role: data.user.role || 'user',
    };
    saveSession(session);
    injectApiKeys(session.userId);
    setUser(session);
    return session.role;
  }, []);

  const register = useCallback(async (phone: string, password: string, displayName?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password, displayName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '注册失败');

    const session: SessionData = {
      userId: data.user.userId,
      phone: data.user.phone,
      displayName: data.user.displayName,
      token: data.token,
      loginAt: Date.now(),
      role: data.user.role || 'user',
    };
    saveSession(session);
    injectApiKeys(session.userId);
    setUser(session);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    clearInjectedApiKeys();
    resetTextStreamAdapter();
    setUser(null);
  }, []);

  const updateApiKeys = useCallback((keys: Omit<ApiKeys, 'updatedAt'>) => {
    if (!user) return;
    saveApiKeys(user.userId, keys);
    injectApiKeys(user.userId);
    resetTextStreamAdapter();
    // 异步同步到后端
    syncApiKeysToServer(user.token, keys);
  }, [user]);

  const getMyApiKeys = useCallback((): ApiKeys | null => {
    if (!user) return null;
    return getApiKeys(user.userId);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateApiKeys, getMyApiKeys }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
