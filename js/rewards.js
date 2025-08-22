// js/rewards.js — 정답 보상(포인트 + 랜덤 드랍) 최종본
// 정책: 총 드랍 확률 25% (대형 1%, 일반 24%) — CONFIG가 있으면 그 값을 우선 사용.

(function () {
  // 안전 접근
  const CFG = (window.CONFIG || {});
  const R   = (CFG.REWARD || {});
  const POINT_PER_CORRECT = Number(CFG.POINTS_PER_CORRECT ?? 1);

  // 기본값: 총 25% (big 1%, small 24%)
  const BIG_RATE_DEFAULT   = 0.01;
  const SMALL_RATE_DEFAULT = 0.24;

  const BIG_RATE   = Math.max(0, Math.min(1, Number(R.BIG_RATE   ?? BIG_RATE_DEFAULT)));
  const SMALL_RATE = Math.max(0, Math.min(1, Number(R.SMALL_RATE ?? SMALL_RATE_DEFAULT)));

  // 아이템 ID: 설정 우선, 없으면 기본
  const SMALL_ITEM_ID = String(R.SMALL_ITEM_ID || 'sticker_star'); // 소모형(개수 +1)
  const BIG_ITEM_ID   = String(R.BIG_ITEM_ID   || 'badge_gold');   // 소장형(true)

  // 로컬 폴백용 유틸
  function locaPointsGet() {
    return Number(localStorage.getItem('soi:points') || '0');
  }
  function locaPointsAdd(delta) {
    const v = locaPointsGet() + Number(delta || 0);
    localStorage.setItem('soi:points', String(v));
    // 뱃지 즉시 반영
    window.dispatchEvent(new Event('points:changed'));
    return v;
  }
  function locaInvGet() {
    try { return JSON.parse(localStorage.getItem('soi:inventory') || '{}'); }
    catch { return {}; }
  }
  function locaInvSet(obj) {
    localStorage.setItem('soi:inventory', JSON.stringify(obj || {}));
  }

  async function ensureStoreReady(timeout = 2000) {
    if (window.SoiStore?.currentUser) return;
    const t0 = Date.now();
    await new Promise((res, rej) => {
      (function poll() {
        if (window.SoiStore?.currentUser) return res();
        if (Date.now() - t0 >= timeout) return rej(new Error('SoiStore timeout'));
        setTimeout(poll, 50);
      })();
    });
  }

  async function awardViaStore() {
    await ensureStoreReady();

    let user = await window.SoiStore.currentUser();
    if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com', 'local-demo');
    const uid = user.uid;

    // 1) 포인트
    let doc = await window.SoiStore.getUserDoc(uid);
    doc.points = Math.max(0, Number(doc.points || 0) + POINT_PER_CORRECT);
    doc.rewards ||= {};

    // 2) 드랍
    const r = Math.random();
    let dropped = null; // {id, amount}
    if (r < BIG_RATE) {
      // 대형: 소장형 1개
      doc.rewards[BIG_ITEM_ID] = (doc.rewards[BIG_ITEM_ID] || 0) + 1;
      dropped = { id: BIG_ITEM_ID, amount: 1, tier: 'big' };
      await window.SoiStore.pushLog(uid, { source: '퀴즈', tier: 'big', action: 'drop', points: 0, couponName: BIG_ITEM_ID });
    } else if (r < BIG_RATE + SMALL_RATE) {
      // 일반: 소모형 +1
      doc.rewards[SMALL_ITEM_ID] = (doc.rewards[SMALL_ITEM_ID] || 0) + 1;
      dropped = { id: SMALL_ITEM_ID, amount: 1, tier: 'small' };
      await window.SoiStore.pushLog(uid, { source: '퀴즈', tier: 'normal', action: 'drop', points: 0, couponName: SMALL_ITEM_ID });
    }

    // 3) 저장 & 로깅
    doc = await window.SoiStore.setUserDoc(uid, doc);
    await window.SoiStore.pushLog(uid, { source: '퀴즈', tier: 'earn', action: 'correct', points: POINT_PER_CORRECT, couponName: '' });

    // 4) 로컬 포인트/인벤 미러링(헤더 뱃지 즉시 반영)
    try {
      const newPts = Math.max(0, Number(localStorage.getItem('soi:points') || '0')) + POINT_PER_CORRECT;
      localStorage.setItem('soi:points', String(newPts));
      window.dispatchEvent(new Event('points:changed'));

      if (dropped) {
        const inv = locaInvGet();
        // 대형도 카운트형으로 일단 누적(보유 수 표시/상점 호환)
        inv[dropped.id] = (inv[dropped.id] || 0) + dropped.amount;
        locaInvSet(inv);
      }
    } catch (e) {
      // 미러 실패는 무시
      console.debug('[rewards] local mirror skipped:', e);
    }
  }

  function awardViaLocalFallback() {
    // 포인트
    locaPointsAdd(POINT_PER_CORRECT);

    // 드랍
    const r = Math.random();
    const inv = locaInvGet();
    if (r < BIG_RATE) {
      inv[BIG_ITEM_ID] = (inv[BIG_ITEM_ID] || 0) + 1;
    } else if (r < BIG_RATE + SMALL_RATE) {
      inv[SMALL_ITEM_ID] = (inv[SMALL_ITEM_ID] || 0) + 1;
    }
    locaInvSet(inv);
  }

  // 외부에서: await window.SOI_awardOnCorrect();
  window.SOI_awardOnCorrect = async function SOI_awardOnCorrect() {
    try {
      await awardViaStore();
    } catch (e) {
      console.warn('[SOI_awardOnCorrect] store path skipped, fallback to local:', e?.message || e);
      // SoiStore가 없거나 실패하면 로컬 폴백
      awardViaLocalFallback();
    }
  };
})();
