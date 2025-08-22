// js/api-shim.js — 클라이언트 API 단일 진입점 (완성본)
// - CONFIG.GOOGLE_SHEET_TSV가 있으면 그것을 우선 사용(공개 시트)
// - 없으면 서버 프록시 /api/problems 사용
// - 사용자 데이터 저장/조회 래핑 (GET/POST)
// - 기존 코드 호환을 위해 getUserData 별칭도 제공
(function () {
  'use strict';

  const CFG = window.CONFIG || {};
  const SHEET_URL = (CFG.GOOGLE_SHEET_TSV || '').trim();
  const EP = CFG.ENDPOINTS || {}; // { PROBLEMS, DATA_GET:(u)=>..., DATA_POST:(u)=>... }

  // ---- 공통 fetch 유틸(타임아웃 + HTML 오서빙 감지) ----
  function withTimeout(promise, ms = 15000, tag = 'request') {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), ms);
    return Promise.race([
      promise(ac.signal),
      new Promise((_, rej) => setTimeout(() => rej(new Error(`${tag} timeout`)), ms + 10)),
    ]).finally(() => clearTimeout(t));
  }

  async function fetchText(url) {
    return withTimeout(async (signal) => {
      const r = await fetch(url, { cache: 'no-store', signal });
      if (!r.ok) throw new Error(`HTTP ${r.status} @ ${url}`);
      // JS 경로가 HTML로 잘못 서빙되는 경우(콘텐츠 타입/시작문자 검사)
      const ct = (r.headers.get('content-type') || '').toLowerCase();
      const text = await r.text();
      if (ct.includes('text/html') || text.trim().startsWith('<!DOCTYPE')) {
        console.warn('[api-shim] HTML이 내려왔습니다. 정적 라우팅/파일경로를 확인하세요:', url);
      }
      return text;
    }, 15000, `fetchText ${url}`);
  }

  async function fetchJSON(url, opts = {}) {
    return withTimeout(async (signal) => {
      const r = await fetch(url, { cache: 'no-store', ...opts, signal });
      if (!r.ok) throw new Error(`HTTP ${r.status} @ ${url}`);
      const ct = (r.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('application/json')) {
        console.warn('[api-shim] JSON이 아닌 컨텐츠 타입입니다:', ct, 'url=', url);
      }
      return r.json().catch(() => ({}));
    }, 15000, `fetchJSON ${url}`);
  }

  // ---- API 구현 ----
  async function problems() {
    // 공개 시트가 명시되면 직접 접근, 아니면 서버 프록시 사용
    const url =
      (SHEET_URL && SHEET_URL.startsWith('http') ? SHEET_URL : '') ||
      EP.PROBLEMS ||
      '/api/problems';

    return fetchText(url); // TSV/CSV 원문 텍스트 반환
  }

  async function loadUserData(user) {
    if (!user) return {};
    const url = EP.DATA_GET ? EP.DATA_GET(user) : `/api/data/${encodeURIComponent(String(user))}`;
    try {
      return await fetchJSON(url);
    } catch (e) {
      console.warn('[api-shim] loadUserData 실패, 빈 객체 반환:', e?.message || e);
      return {};
    }
  }

  async function saveUserData(user, blob) {
    if (!user) return { ok: false, reason: 'no-user' };
    const url = EP.DATA_POST ? EP.DATA_POST(user) : `/api/data/${encodeURIComponent(String(user))}`;
    try {
      return await fetchJSON(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blob || {}),
      });
    } catch (e) {
      console.warn('[api-shim] saveUserData 실패:', e?.message || e);
      // 서버 저장이 실패해도 로컬은 계속 동작하니, 최소 ok:false 로 응답
      return { ok: false, error: String(e?.message || e) };
    }
  }

  // ---- 전역 노출 (구버전 호환: getUserData 별칭 포함) ----
  window.API = {
    problems,
    loadUserData,
    getUserData: loadUserData,   // ⬅️ 호환용 별칭
    saveUserData,
  };

  // 디버깅 힌트
  // console.debug('[api-shim] ready', { useDirectSheet: !!SHEET_URL });
})();
