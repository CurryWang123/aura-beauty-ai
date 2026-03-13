import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { signToken, authMiddleware } from '../middleware/auth.js';

const router = Router();
const PHONE_REGEX = /^1[3-9]\d{9}$/;

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, password, displayName } = req.body;

    if (!phone || !PHONE_REGEX.test(phone)) {
      res.status(400).json({ error: '请输入有效的手机号' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: '密码至少 6 位' });
      return;
    }

    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: '该手机号已注册' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (phone, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, phone, display_name, role, created_at',
      [phone, passwordHash, displayName || null]
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id, phone: user.phone, role: user.role });

    res.status(201).json({
      token,
      user: {
        userId: user.id,
        phone: user.phone,
        displayName: user.display_name || '',
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    // admin 账号跳过手机号格式校验
    if (!phone || (phone !== 'admin' && !PHONE_REGEX.test(phone))) {
      res.status(400).json({ error: '请输入有效的手机号' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: '请输入密码' });
      return;
    }

    const result = await pool.query(
      'SELECT id, phone, password_hash, display_name, role FROM users WHERE phone = $1',
      [phone]
    );
    if (result.rows.length === 0) {
      res.status(401).json({ error: '手机号未注册' });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: '密码错误' });
      return;
    }

    const token = signToken({ userId: user.id, phone: user.phone, role: user.role });

    res.json({
      token,
      user: {
        userId: user.id,
        phone: user.phone,
        displayName: user.display_name || '',
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, phone, display_name, role, created_at FROM users WHERE id = $1',
      [req.user!.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const user = result.rows[0];
    res.json({
      userId: user.id,
      phone: user.phone,
      displayName: user.display_name || '',
      role: user.role,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

export default router;
