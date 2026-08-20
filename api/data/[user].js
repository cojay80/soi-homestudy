// api/data/[user].js — GET: 학습데이터 조회, POST: 학습데이터 저장(전체 덮어쓰기)
import { getRedis } from '../_kv.js';

export default async function handler(req, res) {
  const user = String(req.query.user || '');
  const redis = getRedis();
  const key = `soi:user:${user}`;

  if (req.method === 'GET') {
    if (!redis || !user) return res.status(200).json({});
    try {
      const blob = await redis.get(key);
      return res.status(200).json(blob || {});
    } catch (e) {
      console.error('[data:get]', e.message);
      return res.status(200).json({});
    }
  }

  if (req.method === 'POST') {
    if (!redis || !user) return res.status(200).json({ ok: true, memo: 'no-db-mode' });
    try {
      await redis.set(key, req.body || {});
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('[data:post]', e.message);
      return res.status(500).json({ ok: false });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).end('Method Not Allowed');
}
