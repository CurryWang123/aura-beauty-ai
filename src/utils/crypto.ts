/**
 * 密码哈希工具（Web Crypto API，SHA-256 + salt）
 */

/** 生成随机 salt（hex 字符串） */
export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 哈希 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** 生成密码哈希，返回 "salt:hash" 格式 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const hash = await sha256(salt + password);
  return `${salt}:${hash}`;
}

/** 验证密码，传入原始密码和存储的 "salt:hash" 字符串 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, expectedHash] = stored.split(':');
  if (!salt || !expectedHash) return false;
  const hash = await sha256(salt + password);
  return hash === expectedHash;
}
