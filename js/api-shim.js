// js/api-shim.js — 서버 API 래퍼 + 안전한 Fallback 최종본
// 사용처:
//  - quiz.js : /api/problems (TSV) 로 문제 받기
//  - quiz.js/notes.js/record.js : /api/data/:user (GET/POST) 동기화
// 특징:
//  - 타임아웃/재시도
//  - 서버 실패 시 로컬스토리지 Fallback
//  - 콘솔 경고만 남기고 UI는 최대한 계속 동작

(function () {
  const API = {};
  const DEFAULT_TIMEOUT = 8000; // ms
  const RETRIES = 1;           // 1회 재시도

  // --- 내부 유틸 ---
  function withTimeout(promise, ms, tag='request') {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`Timeout: ${tag}`)), ms);
      promise.then(v => { clearTimeout(t); resolve(v); })
             .catch(e => { clearTimeout(t); reject(e); });
    });
  }

  async function fetchSafe(url, opts={}, tag='fetch') {
    // 재시도 1회
    for (let attempt=0; attempt<=RETRIES; attempt++) {
      try {
        const res = await withTimeout(fetch(url, opts), DEFAULT_TIMEOUT, tag);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
      } catch (e) {
        if (attempt < RETRIES) {
          console.warn(`[api-shim] retry ${attempt+1} for ${url}:`, e.message || e);
          continue;
        }
        throw e;
      }
    }
  }

  // --- 문제 가져오기 (/api/problems → TSV 텍스트) ---
  // 성공: 문자열(TSV)
  // 실패: 로컬 캐시(mock:problems) → 없으면 빈 문자열
  API.problems = async function () {
    try {
      const res = await fetchSafe('/api/problems', { method: 'GET' }, 'problems');
      const text = await res.text();
      // 간단 검증: 헤더 라인이 포함되어 있나?
      if (!/학년\s*\t\s*과목\s*\t\s*질문/i.test(text)) {
        console.warn('[api-shim] 문제 TSV 헤더 감지 실패(그래도 반환합니다).');
      }
      // 캐시
      localStorage.setItem('mock:problems', text);
      return text;
    } catch (e) {
      console.warn('[api-shim] /api/problems 실패 → 로컬 캐시 사용:', e.message || e);
      return localStorage.getItem('mock:problems') || '';
    }
  };

  // --- 사용자 데이터 로드 (/api/data/:user GET) ---
  // 성공: 객체
  // 실패: 로컬 studyData 객체에서 해당 사용자 부분 반환
  API.loadUserData = async function (user) {
    user = String(user || '').trim();
    const sd = safeStudyData();
    if (!user) return {};
    try {
      const res = await fetchSafe(`/api/data/${encodeURIComponent(user)}`, { method: 'GET' }, 'data:GET');
      const obj = await res.json();
      // 서버 응답이 비어있으면 기존 로컬 병합 유지
      if (obj && typeof obj === 'object') {
        // 병합(서버 > 로컬)
        const merged = { ...(sd[user] || {}), ...(obj || {}) };
        sd[user] = merged;
        saveStudyData(sd);
        return merged;
      }
      return sd[user] || {};
    } catch (e) {
      console.warn('[api-shim] loadUserData 실패 → 로컬 사용:', e.message || e);
      return sd[user] || {};
    }
  };

  // --- 사용자 데이터 저장 (/api/data/:user POST) ---
  // 성공/실패 여부와 무관하게, 먼저 로컬에 저장 → 서버 시도
  API.saveUserData = async function (user, dataObj) {
    user = String(user || '').trim();
    if (!user || !dataObj || typeof dataObj !== 'object') return false;

    // 로컬 반영
    const sd = safeStudyData();
    sd[user] = dataObj[user] || dataObj || sd[user] || {};
    saveStudyData(sd);

    try {
      await fetchSafe(`/api/data/${encodeURIComponent(user)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sd)
      }, 'data:POST');
      return true;
    } catch (e) {
      console.warn('[api-shim] saveUserData 실패(로컬은 저장됨):', e.message || e);
      return false;
    }
  };

  // --- 로컬 헬퍼 ---
  function safeStudyData() {
    try { return JSON.parse(localStorage.getItem('studyData') || '{}'); }
    catch { return {}; }
  }
  function saveStudyData(obj) {
    localStorage.setItem('studyData', JSON.stringify(obj || {}));
  }

  // 전역 노출
  window.API = API;
})();
