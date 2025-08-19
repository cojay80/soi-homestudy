// js/core-auth-store.js
// 간단 로컬스토리지 기반 SoiStore.
// Firebase가 비어있으면 이 로컬 모드로 동작.

(function (global) {
  const LS_CURRENT = "soi_current_uid";
  const LS_DOC = (uid) => `soi_user_doc_${uid}`;
  const LS_LOG = (uid) => `soi_user_logs_${uid}`;
  const OFFLINE_UID = "local-offline-uid";

  function readJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }
  function writeJSON(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch {}
  }

  const api = {
    async currentUser() {
      const uid = localStorage.getItem(LS_CURRENT);
      return uid ? { uid } : null;
    },

    async signIn(email, password) {
      // 오프라인 모드: 항상 같은 uid 사용
      localStorage.setItem(LS_CURRENT, OFFLINE_UID);
      // 기본 문서가 없으면 생성
      const doc = readJSON(LS_DOC(OFFLINE_UID), null);
      if (!doc) {
        writeJSON(LS_DOC(OFFLINE_UID), {
          name: "",
          points: 0,
          rewards: {},
          goals: [],
          records: [],
          incorrect: []
        });
      }
      return { uid: OFFLINE_UID };
    },

    async signOut() {
      localStorage.removeItem(LS_CURRENT);
    },

    async getUserDoc(uid) {
      return readJSON(LS_DOC(uid), {
        name: "",
        points: 0,
        rewards: {},
        goals: [],
        records: [],
        incorrect: []
      });
    },

    async setUserDoc(uid, patch) {
      const cur = await this.getUserDoc(uid);
      const next = { ...cur, ...patch };
      writeJSON(LS_DOC(uid), next);
      return next;
    },

    async pushLog(uid, entry) {
      const logs = readJSON(LS_LOG(uid), []);
      logs.push({ time: new Date().toISOString(), ...entry });
      writeJSON(LS_LOG(uid), logs);
    }
  };

  global.SoiStore = api;
})(window);
