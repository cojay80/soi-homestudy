// api/_kv.js — Vercel Marketplace의 Redis(Upstash) 연동용 클라이언트
// Redis 통합을 추가하면 Vercel이 프로젝트에 REST URL/TOKEN 환경변수를 자동 주입합니다.
// (신규 통합은 UPSTASH_REDIS_REST_*, 구버전 Vercel KV 호환은 KV_REST_API_* 이름을 씁니다.)
import { Redis } from '@upstash/redis';

let client;

export function getRedis() {
  if (client !== undefined) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  client = url && token ? new Redis({ url, token }) : null;
  if (!client) console.warn('[kv] Redis 환경변수 없음 (no-db mode)');
  return client;
}
