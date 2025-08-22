// js/soi-store.js — 로컬에 영구 저장(offline-first, 이벤트/동기화 보강판)

const SOI_KEYS = {
  POINTS: 'soi:points',
  HISTORY: 'soi:history',
  WRONGS: 'soi:wrongs',
  INVENTORY: 'soi:inventory',
};

function soi_numGet(k, d = 0) {
  const v = localStorage.getItem(k);
  return v == null ? d : Number(v);
}
function soi_numSet(k, n) { localStorage.setItem(k, String(n)); }

function soi_arrGet(k) {
  try { return JSON.parse(localStorage.getItem(k) || '[]'); }
  catch(_) { return []; }
}
function soi_arrSet(k, arr) { localStorage.setItem(k, JSON.stringify(arr)); }

function soi_objGet(k) {
  try { return JSON.parse(localStorage.getItem(k) || '{}'); }
  catch(_) { return {}; }
}
function soi_objSet(k, obj) { localStorage.setItem(k, JSON.stringify(obj)); }

// ---- 포인트 ----
function soi_pointsGet() { return soi_numGet(SOI_KEYS.POINTS, 0); }

function soi_pointsAdd(delta) {
  const v = soi_pointsGet() + Number(delta || 0);
  soi_numSet(SOI_KEYS.POINTS, v);

  // 배지 즉시 반영
  try {
    document.querySelectorAll('[data-soi-points]').forEach(el => el.textContent = v);
  } catch {}

  // 헤더/다른 컴포넌트 갱신 신호
  try { window.dispatchEvent(new Event('points:changed')); } catch {}

  return v;
}

// ---- 히스토리 (1회 퀴즈 결과 단위) ----
function soi_historyPush(entry) {
  const arr = soi_arrGet(SOI_KEYS.HISTORY);
  arr.push(entry);
  soi_arrSet(SOI_KEYS.HISTORY, arr);
  return arr.length;
}

// ---- 오답 노트 (구 레거시 용도) ----
function soi_wrongsAdd(wrongs) {
  if (!wrongs || !wrongs.length) return;
  const arr = soi_arrGet(SOI_KEYS.WRONGS);
  soi_arrSet(SOI_KEYS.WRONGS, arr.concat(wrongs));
}

// ---- 상점 인벤토리 ----
function soi_inventoryGet(){ return soi_objGet(SOI_KEYS.INVENTORY); }
function soi_inventorySet(obj){
  soi_objSet(SOI_KEYS.INVENTORY, obj || {});
  // 인벤 변경은 포인트처럼 잦진 않지만, 필요 시 다른 탭에서 감지하도록 storage 이벤트로 커버됨
}

// ---- 공용: 헤더 포인트 뱃지 즉시 렌더 ----
function soi_renderPointsBadges() {
  const p = soi_pointsGet();
  try {
    document.querySelectorAll('[data-soi-points]').forEach(el => el.textContent = p);
  } catch {}
}

// 초기 렌더
document.addEventListener('DOMContentLoaded', soi_renderPointsBadges);

// 탭 간 동기화: 다른 탭에서 포인트/인벤 변화 시 즉시 반영
window.addEventListener('storage', (ev) => {
  if (ev.key === SOI_KEYS.POINTS) {
    soi_renderPointsBadges();
    // 헤더에게도 알려주기
    try { window.dispatchEvent(new Event('points:changed')); } catch {}
  }
  // 인벤은 화면마다 렌더 로직이 달라서 여기선 포인트처럼 강제 렌더 안 함(상점은 자체 listener로 처리)
});

// ---- 전역 노출(다른 스크립트 폴백용) ----
window.soi_pointsAdd = soi_pointsAdd;
window.soi_pointsGet = soi_pointsGet;
window.soi_inventoryGet = soi_inventoryGet;
window.soi_inventorySet = soi_inventorySet;
window.soi_renderPointsBadges = soi_renderPointsBadges;
window.soi_historyPush = soi_historyPush;
window.soi_wrongsAdd = soi_wrongsAdd;
