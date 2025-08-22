// /js/drop.js — 뽑기/보상 관리 (완성본)
// - rollTier: small/medium/large/none 확률 굴림
// - applyPity: 누적 실패(pity) 시 보정
// - award: 보상 지급 (포인트/쿠폰 반영 + 로그)
// - rollback: 보상 취소 (award() 반환객체 기반)
// - rollWithPity: 누적 실패 기반 확률 굴림

(function (global) {
  const cfg = window.SOI_CONFIG || {};
  const dropCfg = cfg.drop || { small: 50, medium: 30, large: 5, pityThreshold: 6, pityGuarantee: "small" };

  const Drop = {
    rollTier({ small, medium, large }) {
      let r = Math.random() * 100;
      if (r < large) return "large"; r -= large;
      if (r < medium) return "medium"; r -= medium;
      if (r < small) return "small";
      return "none";
    },

    applyPity(tier, pityGuarantee) {
      if (pityGuarantee === "medium") {
        if (tier === "none" || tier === "small") return "medium";
      } else {
        if (tier === "none") return "small";
      }
      return tier;
    },

    async award({ uid, source, tier }) {
      const store = window.SoiStore;
      const doc = await store.getUserDoc(uid);
      let deltaPts = 0, couponId = null, couponName = null;

      if (tier === "large") {
        if (cfg.largeAsCoupon && cfg.largeCouponRewardId) {
          couponId = cfg.largeCouponRewardId;
          const catalog = (cfg.defaultRewards || []);
          const reward = catalog.find(r => r.id === couponId);
          couponName = reward ? reward.name : "쿠폰";
          doc.rewards = doc.rewards || {};
          doc.rewards[couponId] = (doc.rewards[couponId] || 0) + 1;

          if (cfg.largeAlsoPoints) deltaPts += (cfg.largeAlsoPointsPts || 0);
        } else {
          deltaPts += 20;
        }
      } else if (tier === "medium") {
        deltaPts += 10;
      } else if (tier === "small") {
        deltaPts += 5;
      }

      doc.points = Math.max(0, (doc.points || 0) + deltaPts);
      doc.missStreak = (tier === "none") ? (doc.missStreak || 0) + 1 : 0;

      await store.setUserDoc(uid, { points: doc.points, rewards: doc.rewards, missStreak: doc.missStreak });
      await store.pushLog(uid, { source, tier, points: deltaPts, couponName, action: "award" });

      return { tier, amount: deltaPts, couponId, couponName };
    },

    async rollback({ uid, source, award }) {
      if (!award || !award.tier) return;
      const store = window.SoiStore;
      const doc = await store.getUserDoc(uid);
      let pts = doc.points || 0, couponName = null;

      if (award.tier === "large" && award.couponId && cfg.largeAsCoupon) {
        const rwd = (cfg.defaultRewards || []).find(r => r.id === award.couponId);
        couponName = rwd ? rwd.name : "쿠폰";
        doc.rewards = doc.rewards || {};
        doc.rewards[award.couponId] = Math.max(0, (doc.rewards[award.couponId] || 0) - 1);
      }

      pts = Math.max(0, pts - (award.amount || 0));
      await store.setUserDoc(uid, { points: pts, rewards: doc.rewards });
      await store.pushLog(uid, { source, tier: award.tier, points: -(award.amount || 0), couponName, action: "rollback" });
    },

    async rollWithPity(uid) {
      const store = window.SoiStore;
      const doc = await store.getUserDoc(uid);
      const pity = (doc.missStreak || 0) >= (dropCfg.pityThreshold || 6);
      let tier = Drop.rollTier(dropCfg);
      if (pity) tier = Drop.applyPity(tier, dropCfg.pityGuarantee || "small");
      return tier;
    },
  };

  global.SoiDrop = Drop;
})(window);
