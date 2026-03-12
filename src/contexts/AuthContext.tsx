import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { hashPassword, verifyPassword } from '../utils/crypto';
import {
  StoredUser,
  SessionData,
  ApiKeys,
  getUsers,
  saveUser,
  findUserByUsername,
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
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
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

function clearApiKeys(): void {
  delete (window as any).__jubeauty_api_keys__;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 启动时恢复 session
  useEffect(() => {
    const session = getSession();
    if (session) {
      const users = getUsers();
      if (users[session.userId]) {
        injectApiKeys(session.userId);
        setUser(session);
      } else {
        clearSession();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const stored = findUserByUsername(username);
    if (!stored) throw new Error('用户名不存在');
    const ok = await verifyPassword(password, stored.passwordHash);
    if (!ok) throw new Error('密码错误');

    const session: SessionData = { userId: stored.id, username: stored.username, loginAt: Date.now() };
    saveSession(session);
    injectApiKeys(stored.id);
    setUser(session);
  }, []);

  const register = useCallback(async (username: string, password: string, displayName?: string) => {
    if (!username.trim()) throw new Error('用户名不能为空');
    if (password.length < 6) throw new Error('密码至少 6 位');
    if (findUserByUsername(username)) throw new Error('用户名已存在');

    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const passwordHash = await hashPassword(password);
    const newUser: StoredUser = {
      id,
      username,
      displayName: displayName || username,
      passwordHash,
      createdAt: Date.now(),
    };
    saveUser(newUser);

    const session: SessionData = { userId: id, username, loginAt: Date.now() };
    saveSession(session);
    injectApiKeys(id);
    setUser(session);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    clearApiKeys();
    resetTextStreamAdapter();
    setUser(null);
  }, []);

  const updateApiKeys = useCallback((keys: Omit<ApiKeys, 'updatedAt'>) => {
    if (!user) return;
    saveApiKeys(user.userId, keys);
    injectApiKeys(user.userId);
    resetTextStreamAdapter();
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
