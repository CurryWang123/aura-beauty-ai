import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/users - 用户列表（分页、搜索）
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const search = (req.query.search as string || '').trim();
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: any[] = [];

    if (search) {
      whereClause = "WHERE u.phone ILIKE $1 OR u.display_name ILIKE $1";
      params.push(`%${search}%`);
    }

    // 总数
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 列表数据
    const listParams = [...params, pageSize, offset];
    const result = await pool.query(
      `SELECT
        u.id, u.phone, u.display_name, u.role, u.created_at,
        (SELECT COUNT(*) FROM chat_messages cm WHERE cm.user_id = u.id) AS message_count,
        EXISTS(SELECT 1 FROM user_api_keys ak WHERE ak.user_id = u.id AND (ak.doubao_api_key != '' OR ak.gemini_api_key != '')) AS has_api_key
       FROM users u
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      listParams
    );

    res.json({
      users: result.rows.map(r => ({
        id: r.id,
        phone: r.phone,
        displayName: r.display_name || '',
        role: r.role,
        createdAt: r.created_at,
        messageCount: parseInt(r.message_count),
        hasApiKey: r.has_api_key,
      })),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// GET /api/admin/users/:id - 用户详情
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      'SELECT id, phone, display_name, role, created_at FROM users WHERE id = $1',
      [id]
    );
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const user = userResult.rows[0];

    // API Keys
    const keysResult = await pool.query(
      'SELECT doubao_api_key, gemini_api_key, openai_api_key, updated_at FROM user_api_keys WHERE user_id = $1',
      [id]
    );
    const keys = keysResult.rows[0] || null;

    // 消息统计
    const msgStats = await pool.query(
      'SELECT stage, COUNT(*) as count FROM chat_messages WHERE user_id = $1 GROUP BY stage',
      [id]
    );

    res.json({
      id: user.id,
      phone: user.phone,
      displayName: user.display_name || '',
      role: user.role,
      createdAt: user.created_at,
      apiKeys: keys ? {
        doubaoApiKey: maskKey(keys.doubao_api_key),
        geminiApiKey: maskKey(keys.gemini_api_key),
        openaiApiKey: maskKey(keys.openai_api_key),
        updatedAt: keys.updated_at,
      } : null,
      messageStats: msgStats.rows.map(r => ({ stage: r.stage, count: parseInt(r.count) })),
    });
  } catch (err) {
    console.error('Admin get user detail error:', err);
    res.status(500).json({ error: '获取用户详情失败' });
  }
});

// POST /api/admin/users - 新增用户
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { phone, password, displayName, role } = req.body;
    if (!phone || !password || password.length < 6) {
      res.status(400).json({ error: '手机号和密码（至少6位）必填' });
      return;
    }

    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: '该手机号已存在' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (phone, password_hash, display_name, role) VALUES ($1, $2, $3, $4) RETURNING id, phone, display_name, role, created_at',
      [phone, hash, displayName || null, role || 'user']
    );
    const user = result.rows[0];
    res.status(201).json({
      id: user.id,
      phone: user.phone,
      displayName: user.display_name || '',
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Admin create user error:', err);
    res.status(500).json({ error: '创建用户失败' });
  }
});

// PUT /api/admin/users/:id - 编辑用户
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { phone, displayName, role, password } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (phone !== undefined) {
      updates.push(`phone = $${idx++}`);
      params.push(phone);
    }
    if (displayName !== undefined) {
      updates.push(`display_name = $${idx++}`);
      params.push(displayName);
    }
    if (role !== undefined) {
      updates.push(`role = $${idx++}`);
      params.push(role);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${idx++}`);
      params.push(hash);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: '没有要更新的字段' });
      return;
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, phone, display_name, role, created_at`,
      params
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      phone: user.phone,
      displayName: user.display_name || '',
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).json({ error: '更新用户失败' });
  }
});

// DELETE /api/admin/users/:id - 删除用户
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 不能删除自己
    if (id === req.user!.userId) {
      res.status(400).json({ error: '不能删除自己' });
      return;
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: '删除用户失败' });
  }
});

// GET /api/admin/users/:id/messages - 用户全部消息（按 stage 分组）
router.get('/users/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT stage, role, content, message_index, created_at FROM chat_messages WHERE user_id = $1 ORDER BY stage, message_index',
      [id]
    );

    const grouped: Record<string, any[]> = {};
    for (const row of result.rows) {
      if (!grouped[row.stage]) grouped[row.stage] = [];
      grouped[row.stage].push({
        role: row.role,
        content: row.content,
        index: row.message_index,
        createdAt: row.created_at,
      });
    }

    res.json({ messages: grouped });
  } catch (err) {
    console.error('Admin get user messages error:', err);
    res.status(500).json({ error: '获取消息失败' });
  }
});

// GET /api/admin/users/:id/messages/:stage - 某用户某阶段的消息详情
router.get('/users/:id/messages/:stage', async (req: Request, res: Response) => {
  try {
    const { id, stage } = req.params;
    const result = await pool.query(
      'SELECT role, content, message_index, created_at FROM chat_messages WHERE user_id = $1 AND stage = $2 ORDER BY message_index',
      [id, stage]
    );

    res.json({
      stage,
      messages: result.rows.map(r => ({
        role: r.role,
        content: r.content,
        index: r.message_index,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error('Admin get stage messages error:', err);
    res.status(500).json({ error: '获取消息失败' });
  }
});

// GET /api/admin/stats - 统计报表
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // 总用户数
    const totalUsers = await pool.query("SELECT COUNT(*) FROM users WHERE role != 'admin'");
    // 总消息数
    const totalMessages = await pool.query('SELECT COUNT(*) FROM chat_messages');
    // 今日新增用户
    const todayUsers = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role != 'admin' AND created_at >= CURRENT_DATE"
    );
    // 今日消息数
    const todayMessages = await pool.query(
      'SELECT COUNT(*) FROM chat_messages WHERE created_at >= CURRENT_DATE'
    );
    // 各阶段消息分布
    const stageDistribution = await pool.query(
      'SELECT stage, COUNT(*) as count FROM chat_messages GROUP BY stage ORDER BY count DESC'
    );
    // 7天趋势 - 用户注册
    const userTrend = await pool.query(`
      SELECT date_trunc('day', created_at)::date AS date, COUNT(*) AS count
      FROM users WHERE role != 'admin' AND created_at >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY date ORDER BY date
    `);
    // 7天趋势 - 消息
    const messageTrend = await pool.query(`
      SELECT date_trunc('day', created_at)::date AS date, COUNT(*) AS count
      FROM chat_messages WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY date ORDER BY date
    `);
    // 活跃用户 Top 10
    const topUsers = await pool.query(`
      SELECT u.id, u.phone, u.display_name, COUNT(cm.id) AS message_count
      FROM users u JOIN chat_messages cm ON u.id = cm.user_id
      WHERE u.role != 'admin'
      GROUP BY u.id, u.phone, u.display_name
      ORDER BY message_count DESC LIMIT 10
    `);

    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalMessages: parseInt(totalMessages.rows[0].count),
      todayUsers: parseInt(todayUsers.rows[0].count),
      todayMessages: parseInt(todayMessages.rows[0].count),
      stageDistribution: stageDistribution.rows.map(r => ({ stage: r.stage, count: parseInt(r.count) })),
      userTrend: userTrend.rows.map(r => ({ date: r.date, count: parseInt(r.count) })),
      messageTrend: messageTrend.rows.map(r => ({ date: r.date, count: parseInt(r.count) })),
      topUsers: topUsers.rows.map(r => ({
        id: r.id,
        phone: r.phone,
        displayName: r.display_name || '',
        messageCount: parseInt(r.message_count),
      })),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

function maskKey(key: string): string {
  if (!key || key.length < 8) return key ? '****' : '';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

export default router;
