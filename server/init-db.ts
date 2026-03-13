import bcrypt from 'bcryptjs';
import pool from './db.js';

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    // 添加 role 字段（幂等）
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(10) NOT NULL DEFAULT 'user'
    `);

    // 创建 user_api_keys 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doubao_api_key TEXT DEFAULT '',
        gemini_api_key TEXT DEFAULT '',
        openai_api_key TEXT DEFAULT '',
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `);

    // 创建 chat_messages 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        stage VARCHAR(30) NOT NULL,
        role VARCHAR(10) NOT NULL,
        content TEXT NOT NULL,
        message_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 创建索引（幂等）
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_user_stage ON chat_messages(user_id, stage)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at)
    `);

    // 创建默认 admin 账号
    const existing = await client.query("SELECT id FROM users WHERE phone = 'admin'");
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await client.query(
        "INSERT INTO users (phone, password_hash, display_name, role) VALUES ('admin', $1, '系统管理员', 'admin')",
        [hash]
      );
      console.log('Default admin account created');
    }

    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}
