// js/rewards.js — 정답 보상(포인트 + 랜덤 드랍: 총 25%, 그 중 대형 1%)

(async function(){
  async function ensureStoreReady(timeout=2000){
    if (window.SoiStore?.currentUser) return;
    const t0 = Date.now();
    await new Promise((res, rej) => {
      (function poll(){
        if (window.SoiStore?.currentUser) return res();
        if (Date.now()-t0>=timeout) return rej(new Error('SoiStore timeout'));
        setTimeout(poll,50);
      })();
    });
  }

  // 외부에서: await window.SOI_awardOnCorrect();
  window.SOI_awardOnCorrect = async function SOI_awardOnCorrect() {
    try {
      await ensureStoreReady();
      let user = await window.SoiStore.currentUser();
      if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
      const uid = user.uid;

      const POINT_PER_CORRECT = 10;
      let doc = await window.SoiStore.getUserDoc(uid);
      doc.points = (doc.points || 0) + POINT_PER_CORRECT;

      // 총 25%: 대형 1% + 일반 24%
      const roll = Math.random();
      const BIG_RATE  = 0.01;
      const NORM_RATE = 0.24;
      doc.rewards ||= {};

      if (roll < BIG_RATE) {
        doc.rewards['park'] = (doc.rewards['park'] || 0) + 1;
        await window.SoiStore.pushLog(uid, { source:'퀴즈', tier:'big', action:'drop', points:0, couponName:'park' });
      } else if (roll < BIG_RATE + NORM_RATE) {
        const normalPool = ['snack','tv','free','kids','gift'];
        const pick = normalPool[Math.floor(Math.random() * normalPool.length)];
        doc.rewards[pick] = (doc.rewards[pick] || 0) + 1;
        await window.SoiStore.pushLog(uid, { source:'퀴즈', tier:'normal', action:'drop', points:0, couponName:pick });
      }

      doc = await window.SoiStore.setUserDoc(uid, doc);
      await window.SoiStore.pushLog(uid, { source:'퀴즈', tier:'earn', action:'correct', points:POINT_PER_CORRECT, couponName:'' });
    } catch (e) {
      console.warn('[SOI_awardOnCorrect] skipped:', e);
    }
  };
})();
