// js/shop.js — 상점 최종본 (class 기반 UI, 보유/소모품 처리 강화)
// - 포인트 표시:    #shop-points, [data-soi-points]
// - 인벤토리 표시:  #shop-inventory (사람친화적 표기)
// - 아이템 그리드:  #shop-items (shop.html의 grid에 카드로 렌더)
// - 의존: (있으면 사용) soi-store.js → soi_pointsGet/Add, soi_inventoryGet/Set

(function () {
  // ---------- Fallback: soi-store.js 없어도 동작 ----------
  const KEYS = { POINTS: 'soi:points', INVENTORY: 'soi:inventory' };
  const lsNumGet = (k, d = 0) => {
    const v = localStorage.getItem(k);
    return v == null ? d : Number(v);
  };
  const lsNumSet = (k, n) => localStorage.setItem(k, String(n));
  const lsObjGet = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } };
  const lsObjSet = (k, o) => localStorage.setItem(k, JSON.stringify(o || {}));

  const pointsGet = (window.soi_pointsGet) || (() => lsNumGet(KEYS.POINTS, 0));
  const pointsAdd = (window.soi_pointsAdd) || ((delta) => {
    const v = pointsGet() + Number(delta || 0);
    lsNumSet(KEYS.POINTS, v);
    document.querySelectorAll('[data-soi-points]').forEach(el => (el.textContent = v));
    return v;
  });
  const invGet = (window.soi_inventoryGet) || (() => lsObjGet(KEYS.INVENTORY));
  const invSet = (window.soi_inventorySet) || ((o) => lsObjSet(KEYS.INVENTORY, o));

  // ---------- 상점 아이템 (8살 맞춤) ----------
  // cost는 원하는 난이도에 맞게 자유 조정 가능
  const SHOP_ITEMS = [
    // ── 테마(비소모품: 1번만 구매) ──
    { id: 'theme_pink',    title: '핑크 테마',         cost: 20,  consumable: false, detail: '화사한 핑크 테마' },
    { id: 'theme_blue',    title: '블루 테마',         cost: 20,  consumable: false, detail: '시원한 블루 테마' },

    // ── 스티커(소모품: 수량 누적) ──
    { id: 'sticker_star',  title: '별 스티커 ×5',      cost: 10,  consumable: true,  qty: 5,  detail: '칭찬/보상 별 스티커' },
    { id: 'sticker_heart', title: '하트 스티커 ×5',    cost: 10,  consumable: true,  qty: 5,  detail: '응원/격려 하트 스티커' },

    // ── 자유시간/스크린타임 쿠폰(소모품) ──
    { id: 'coupon_freeplay_15', title: '자유시간 15분 쿠폰', cost: 30,  consumable: true, qty: 1, detail: '하고 싶은 놀이 15분 🕒' },
    { id: 'coupon_freeplay_30', title: '자유시간 30분 쿠폰', cost: 55,  consumable: true, qty: 1, detail: '하고 싶은 놀이 30분 🕒' },
    { id: 'coupon_screentime_20', title: '스크린타임 20분', cost: 40,  consumable: true, qty: 1, detail: '영상/게임 20분 🎮' },

    // ── 간식/디저트/식사 선택(소모품) ──
    { id: 'coupon_snack_choice',  title: '간식 선택권',    cost: 25,  consumable: true, qty: 1, detail: '원하는 간식 1개 🍪' },
    { id: 'coupon_dessert_choice',title: '디저트 선택권',  cost: 35,  consumable: true, qty: 1, detail: '원하는 디저트 1개 🍰' },
    { id: 'coupon_dinner_choice', title: '저녁 메뉴 선택권', cost: 80, consumable: true, qty: 1, detail: '오늘 저녁 메뉴는 내가 정해요 🍽️' },

    // ── 취침/외출/문화(소모품) ──
    { id: 'coupon_bedtime_plus_10', title: '취침시간 +10분', cost: 30, consumable: true, qty: 1, detail: '잠들기 전 10분 더 😴' },
    { id: 'coupon_playground',      title: '놀이터 30분',    cost: 90, consumable: true, qty: 1, detail: '놀이터에서 신나게! 🛝' },
    { id: 'coupon_movie_night',     title: '영화밤 쿠폰',     cost: 120, consumable: true, qty: 1, detail: '영화 선택 + 간식 🍿' },

    // ── 책(소모품) ──
    { id: 'coupon_choose_book',     title: '새 책 1권 고르기', cost: 100, consumable: true, qty: 1, detail: '서점/전자책에서 1권 📚' },
  ];

  // 사용자 친화적 이름/이모지(인벤토리 표시에 사용)
  const DISPLAY_MAP = {
    theme_pink:   '핑크 테마 🌸',
    theme_blue:   '블루 테마 💧',
    sticker_star: '별 스티커 ⭐',
    sticker_heart:'하트 스티커 ❤️',

    coupon_freeplay_15:   '자유시간 15분 🕒',
    coupon_freeplay_30:   '자유시간 30분 🕒',
    coupon_screentime_20: '스크린타임 20분 🎮',
    coupon_snack_choice:  '간식 선택권 🍪',
    coupon_dessert_choice:'디저트 선택권 🍰',
    coupon_dinner_choice: '저녁 메뉴 선택권 🍽️',
    coupon_bedtime_plus_10:'취침 +10분 😴',
    coupon_playground:    '놀이터 30분 🛝',
    coupon_movie_night:   '영화밤 쿠폰 🍿',
    coupon_choose_book:   '새 책 1권 📚',

    // 예비 배지들(필요시)
    badge_gold:   '골드 배지 🏅',
    badge_silver: '실버 배지 🥈',
  };

  // ---------- DOM ----------
  const elPoints = document.getElementById('shop-points');
  const elInv    = document.getElementById('shop-inventory');
  const elGrid   = document.getElementById('shop-items');

  // ---------- helpers ----------
  function formatInventory(inv) {
    const ids = Object.keys(inv);
    if (!ids.length) return '없음';
    return ids.map(id => {
      const friendly = DISPLAY_MAP[id] || id;
      const v = inv[id];
      if (typeof v === 'number') return `${friendly} ×${v}`;
      if (v === true)            return `${friendly} (보유)`;
      return `${friendly}: ${JSON.stringify(v)}`;
    }).join(', ');
  }

  function canAfford(points, cost) {
    return Number(points) >= Number(cost);
  }

  // ---------- 렌더 ----------
  function render() {
    const points = pointsGet();
    if (elPoints) elPoints.textContent = points;
    document.querySelectorAll('[data-soi-points]').forEach(el => el.textContent = points);

    const inv = invGet();
    if (elInv) elInv.textContent = formatInventory(inv);

    if (!elGrid) return;
    elGrid.innerHTML = SHOP_ITEMS.map(item => {
      const owned = !item.consumable && !!inv[item.id];
      const disabled = owned || !canAfford(points, item.cost);
      const btnText = owned ? '보유중' : '구매';
      const badge = owned ? `<span class="shop-badge">보유중</span>` : '';
      const qtyInfo = item.consumable && item.qty ? `<span class="shop-qty">×${item.qty}</span>` : '';

      return `
        <article class="shop-card" data-id="${item.id}">
          <div class="shop-card-head">
            <h3 class="shop-card-title">${item.title} ${qtyInfo}</h3>
            <div class="shop-card-right">
              ${badge}
              <span class="shop-card-cost">${item.cost}p</span>
            </div>
          </div>
          ${item.detail ? `<p class="shop-card-desc">${item.detail}</p>` : ''}
          <button class="btn btn-primary shop-buy" data-buy="${item.id}" ${disabled ? 'disabled' : ''}>
            ${btnText}
          </button>
        </article>
      `;
    }).join('');
  }

  // ---------- 구매 ----------
  function onClick(e) {
    const btn = e.target.closest('.shop-buy');
    if (!btn) return;

    const id = btn.getAttribute('data-buy');
    const item = SHOP_ITEMS.find(x => x.id === id);
    if (!item) return;

    const points = pointsGet();
    const inv = invGet();

    if (!item.consumable && inv[id]) {
      alert('이미 보유 중인 아이템입니다.');
      return;
    }
    if (!canAfford(points, item.cost)) {
      alert('포인트가 부족해요!');
      return;
    }

    // 포인트 차감
    pointsAdd(-item.cost);

    // 인벤토리 반영
    if (item.consumable) {
      inv[id] = (inv[id] || 0) + (item.qty || 1);
    } else {
      inv[id] = true;
    }
    invSet(inv);

    alert('구매 완료!');
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    render();
    document.addEventListener('click', onClick);
  });
})();
