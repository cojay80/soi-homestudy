// js/core-auth-store.js — localStorage 영구 저장 버전 (브라우저 전용)
// 기존 코드 전체 교체해도 됩니다.

(function () {
  const DB_PREFIX = 'soi_user_';    // 개별 사용자 데이터 키 접두사
  const KEY_UID   = 'soi_uid';      // 현재 로그인한 UID 저장
  const KEY_NAME  = 'soi_name';     // 화면용 이름 (이미 사용 중)

  // 기본 문서 스키마 (앱 전역 호환)
  function defaultDoc(uid, name = '') {
    return {
      uid,
      name,                // 표시 이름
      points: 0,           // 포인트 합계
      rewards: {},         // 아이템(상점/드랍)
      goals: [],           // {subject, count}
      records: [],         // {date, grade, subject, score}
      incorrect: [],       // 오답 문제 배열
      logs: []             // 활동 로그
    };
  }

  function readDoc(uid) {
    try {
      const raw = localStorage.getItem(DB_PREFIX + uid);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // 과거 필드가 없던 경우를 대비해 스키마 보정
      const merged = { ...defaultDoc(uid), ...parsed };
      return merged;
    } catch (e) {
      console.error('[SoiStore] readDoc error:', e);
      return null;
    }
  }

  function writeDoc(uid, doc) {
    try {
      const safe = { ...defaultDoc(uid), ...doc, uid };
      localStorage.setItem(DB_PREFIX + uid, JSON.stringify(safe));
      return safe;
    } catch (e) {
      console.error('[SoiStore] writeDoc error:', e);
      return doc;
    }
  }

  async function getUserDoc(uid) {
    if (!uid) throw new Error('getUserDoc: uid required');
    const doc = readDoc(uid);
    if (doc) return doc;
    // 최초 생성
    const name = (localStorage.getItem(KEY_NAME) || '').trim();
    return writeDoc(uid, defaultDoc(uid, name));
  }

  async function setUserDoc(uid, data) {
    if (!uid) throw new Error('setUserDoc: uid required');
    const existing = readDoc(uid) || defaultDoc(uid);
    return writeDoc(uid, { ...existing, ...data });
  }

  async function pushLog(uid, entry) {
    if (!uid) throw new Error('pushLog: uid required');
    const doc = await getUserDoc(uid);
    const logs = Array.isArray(doc.logs) ? [...doc.logs] : [];
    logs.push({ ...entry, timestamp: new Date().toISOString() });
    return writeDoc(uid, { ...doc, logs });
  }

  // --- 인증 흉내 (로컬 고정 사용자) ---
  let _currentUser = null;

  function ensureUid(email) {
    // email이 local@demo.com이면 고정 uid를 사용해 세션간 연속성 유지
    if (email && email.startsWith('local@')) return 'local-user-0001';
    // 그 외는 저장된 값 있으면 재사용
    return localStorage.getItem(KEY_UID) || 'local-user-0001';
  }

  async function signIn(email = 'local@demo.com', password = 'local-demo') {
    const uid = ensureUid(email);
    const name = (localStorage.getItem(KEY_NAME) || '').trim();
    // 문서 생성/보정
    const doc = await getUserDoc(uid);
    const next = (name && !doc.name) ? await setUserDoc(uid, { ...doc, name }) : doc;

    localStorage.setItem(KEY_UID, uid);
    _currentUser = { uid, name: next.name || name || '' };
    return _currentUser;
  }

  async function currentUser() {
    if (_currentUser) return _currentUser;
    const uid = localStorage.getItem(KEY_UID);
    const name = (localStorage.getItem(KEY_NAME) || '').trim();
    if (!uid) return null;
    const doc = await getUserDoc(uid);
    _currentUser = { uid, name: doc.name || name || '' };
    return _currentUser;
  }

  async function signOut() {
    try {
      // 문서는 남겨두고, 세션만 끊음
      localStorage.removeItem(KEY_UID);
      _currentUser = null;
    } catch (e) {
      console.warn('[SoiStore] signOut error:', e);
    }
  }

  // 전역 노출
  window.SoiStore = {
    getUserDoc,
    setUserDoc,
    pushLog,
    signIn,
    currentUser,
    signOut
  };
})();
