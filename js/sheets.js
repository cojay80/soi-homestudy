// js/sheets.js — 모바일 안정화 버전 (프록시 실패 시 즉시 TSV 폴백 + 세션 캐시)
// 사용법: await window.SoiSheets.load({ grade:'', subject:'' })

(function () {
  const TSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv";
  const PROXY_URL = "/api/problems";
  const CACHE_KEY = "SOI_TSV_CACHE_V1";

  function parseTSV(text) {
    // HTML이 오면(502, 404 등) 첫 글자가 '<'일 수 있음 → 즉시 실패
    if (text && text.trim().startsWith("<")) {
      throw new Error("TSV expected but got HTML");
    }
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    // 1행은 헤더 (실제 시트 헤더가 다를 수 있어 한국어 키 이름으로 매핑)
    const headers = ['학년','과목','질문','보기1','보기2','보기3','보기4','정답','이미지','지문 ID','지문'];
    const rows = lines.slice(1);
    const out = [];
    for (const line of rows) {
      const cols = line.split('\t');
      const obj = {};
      for (let i = 0; i < headers.length; i++) obj[headers[i]] = cols[i] || '';
      // 편의: 영문 키도 병행
      obj.grade = obj['학년']; obj.subject = obj['과목'];
      out.push(obj);
    }
    return out;
  }

  async function fetchText(url, timeoutMs = 8000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } finally {
      clearTimeout(t);
    }
  }

  async function loadProblems() {
    // 1) 세션 캐시 먼저
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}

    // 2) 서버 프록시 → 실패 시 TSV 폴백
    let text;
    try {
      text = await fetchText(PROXY_URL, 6000);
    } catch (e) {
      // console.warn("proxy fail, fallback tsv:", e);
      text = await fetchText(TSV_URL, 9000);
    }

    const parsed = parseTSV(text);
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(parsed)); } catch {}
    return parsed;
  }

  async function load({ grade = '', subject = '' } = {}) {
    const all = await loadProblems();
    if (!grade && !subject) return all;
    return all.filter(p => (!grade || (p.grade || p['학년']) === grade)
                        && (!subject || (p.subject || p['과목']) === subject));
  }

  window.SoiSheets = { load };
})();
