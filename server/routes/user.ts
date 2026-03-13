import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// PUT /api/user/api-keys - 保存 API Keys
router.put('/api-keys', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { doubaoApiKey, geminiApiKey, openaiApiKey } = req.body;

    await pool.query(
      `INSERT INTO user_api_keys (user_id, doubao_api_key, gemini_api_key, openai_api_key, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET doubao_api_key = $2, gemini_api_key = $3, openai_api_key = $4, updated_at = NOW()`,
      [userId, doubaoApiKey || '', geminiApiKey || '', openaiApiKey || '']
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Save API keys error:', err);
    res.status(500).json({ error: '保存 API Keys 失败' });
  }
});

// POST /api/user/messages - 批量同步某阶段聊天消息
router.post('/messages', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { stage, messages } = req.body;

    if (!stage || !Array.isArray(messages)) {
      res.status(400).json({ error: '参数错误' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // 先删除该用户该阶段的旧消息
      await client.query(
        'DELETE FROM chat_messages WHERE user_id = $1 AND stage = $2',
        [userId, stage]
      );
      // 批量插入新消息
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        await client.query(
          'INSERT INTO chat_messages (user_id, stage, role, content, message_index) VALUES ($1, $2, $3, $4, $5)',
          [userId, stage, msg.role, msg.content, i]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Sync messages error:', err);
    res.status(500).json({ error: '同步消息失败' });
  }
});

export default router;
