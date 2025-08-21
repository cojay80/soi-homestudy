// js/api-shim.js — 클라이언트 API 단일 진입점 (완성본)
// - window.CONFIG.GOOGLE_SHEET_TSV가 있으면 그것을 우선 사용
// - 없으면 서버 프록시 /api/problems 사용
// - 사용자 데이터 저장/조회도 여기서 래핑

(function () {
  const CFG = window.CONFIG || {};
  const SHEET_URL = CFG.GOOGLE_SHEET_TSV || '';
  const EP = (CFG.ENDPOINTS || {});

  async function problems() {
    const url = SHEET_URL && typeof SHEET_URL === 'string' && SHEET_URL.startsWith('http')
      ? SHEET_URL
      : (EP.PROBLEMS || '/api/problems');

    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`problems fetch fail: ${r.status}`);
    return await r.text(); // TSV/CSV 원문 텍스트
  }

  async function loadUserData(user) {
    if (!user) return {};
    const url = (EP.DATA_GET ? EP.DATA_GET(user) : `/api/data/${encodeURIComponent(user)}`);
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return {};
    return await r.json();
  }

  async function saveUserData(user, blob) {
    if (!user) return { ok: false, reason: 'no-user' };
    const url = (EP.DATA_POST ? EP.DATA_POST(user) : `/api/data/${encodeURIComponent(user)}`);
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(blob || {})
    });
    if (!r.ok) throw new Error(`saveUserData fail: ${r.status}`);
    return await r.json();
  }

  window.API = { problems, loadUserData, saveUserData };
})();
