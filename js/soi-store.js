// js/soi-store.js — 로컬에 영구 저장(offline-first)

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

// 포인트
function soi_pointsAdd(delta) {
  const v = soi_numGet(SOI_KEYS.POINTS, 0) + Number(delta || 0);
  soi_numSet(SOI_KEYS.POINTS, v);
  document.querySelectorAll('[data-soi-points]').forEach(el => el.textContent = v);
  return v;
}
function soi_pointsGet() { return soi_numGet(SOI_KEYS.POINTS, 0); }

// 히스토리 (1회 퀴즈 결과 단위)
function soi_historyPush(entry) {
  const arr = soi_arrGet(SOI_KEYS.HISTORY);
  arr.push(entry);
  soi_arrSet(SOI_KEYS.HISTORY, arr);
  return arr.length;
}

// 오답 노트
function soi_wrongsAdd(wrongs) {
  if (!wrongs || !wrongs.length) return;
  const arr = soi_arrGet(SOI_KEYS.WRONGS);
  soi_arrSet(SOI_KEYS.WRONGS, arr.concat(wrongs));
}

// 상점 인벤토리
function soi_inventoryGet(){ return soi_objGet(SOI_KEYS.INVENTORY); }
function soi_inventorySet(obj){ soi_objSet(SOI_KEYS.INVENTORY, obj); }

// 공용: 헤더 포인트 뱃지 즉시 렌더
function soi_renderPointsBadges() {
  const p = soi_pointsGet();
  document.querySelectorAll('[data-soi-points]').forEach(el => el.textContent = p);
}
document.addEventListener('DOMContentLoaded', soi_renderPointsBadges);
