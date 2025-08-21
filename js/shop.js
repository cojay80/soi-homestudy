// js/shop.js — 상점 완성본
// hook: #shop-points, [data-soi-points], #shop-inventory, #shop-items
// soi-store.js가 없더라도 폴백으로 동작(로컬스토리지 사용)

(function () {
  // ---------- 폴백 스토어 ----------
  const K = { POINTS:'soi:points', INV:'soi:inventory' };
  const getNum  = (k,d=0)=>Number(localStorage.getItem(k) ?? d);
  const setNum  = (k,n)=>localStorage.setItem(k, String(n));
  const getObj  = (k)=>{ try{ return JSON.parse(localStorage.getItem(k)||'{}'); }catch{ return {}; } };
  const setObj  = (k,o)=>localStorage.setItem(k, JSON.stringify(o||{}));

  // 외부 스토어가 있으면 사용, 없으면 폴백
  const pointsGet = (window.getPoints) || (()=>getNum(K.POINTS,0));
  const pointsAdd = (window.addPoints) || ((delta)=>{
    const v = pointsGet() + Number(delta||0);
    setNum(K.POINTS, v);
    window.dispatchEvent(new Event('points:changed'));
    return v;
  });
  const invGet = (window.soi_inventoryGet) || (()=>getObj(K.INV));
  const invSet = (window.soi_inventorySet) || ((o)=>setObj(K.INV,o));

  // ---------- 8살 아이가 좋아할 상점 아이템 ----------
  // cost 단위: 포인트. consumable=false(영구소장) / true(소모성, 수량 쌓임)
  const SHOP_ITEMS = [
    { id:'coupon_snack',    title:'간식 쿠폰',          cost: 8,  consumable:true,  qty:1,  detail:'과자/아이스크림 1개' },
    { id:'coupon_play30',   title:'자유시간 30분',      cost: 12, consumable:true,  qty:1,  detail:'게임/유튜브/그림 30분' },
    { id:'coupon_play60',   title:'자유시간 1시간',     cost: 20, consumable:true,  qty:1,  detail:'게임/유튜브/그림 60분' },
    { id:'coupon_movie',    title:'영화의 밤',          cost: 25, consumable:true,  qty:1,  detail:'가족과 팝콘 영화 타임' },
    { id:'coupon_pick',     title:'오늘 메뉴 내가 고른다', cost: 15, consumable:true, qty:1, detail:'저녁 메뉴 결정권' },
    { id:'sticker_star5',   title:'별 스티커 ×5',       cost: 10, consumable:true,  qty:5,  detail:'칭찬 스티커 5장' },
    { id:'sticker_heart5',  title:'하트 스티커 ×5',     cost: 10, consumable:true,  qty:5,  detail:'응원 스티커 5장' },
    { id:'theme_pink',      title:'핑크 테마',          cost: 20, consumable:false,       detail:'사이트 색상 핑크' },
    { id:'theme_blue',      title:'블루 테마',          cost: 20, consumable:false,       detail:'사이트 색상 블루' },
  ];

  // 표시 이름 맵(인벤토리 표기용)
  const DISPLAY = {
    coupon_snack:'간식 쿠폰 🍪',
    coupon_play30:'자유시간 30분 ⏱️',
    coupon_play60:'자유시간 1시간 ⌛',
    coupon_movie:'영화의 밤 🎬',
    coupon_pick:'오늘 메뉴 선택권 🍽️',
    sticker_star5:'별 스티커 ⭐',
    sticker_heart5:'하트 스티커 ❤️',
    theme_pink:'핑크 테마 🌸',
    theme_blue:'블루 테마 💧',
  };

  // ---------- DOM ----------
  const $pts = document.getElementById('shop-points');
  const $inv = document.getElementById('shop-inventory');
  const $grid = document.getElementById('shop-items');

  // ---------- 헬퍼 ----------
  function fmtInv(inv){
    const keys = Object.keys(inv);
    if (!keys.length) return '없음';
    return keys.map(id=>{
      const label = DISPLAY[id] || id;
      const v = inv[id];
      if (typeof v === 'number') return `${label} ×${v}`;
      if (v === true) return `${label} (보유)`;
      return `${label}: ${JSON.stringify(v)}`;
    }).join(', ');
  }
  function canBuy(points, cost, owned, consumable){
    if (!consumable && owned) return false;
    return Number(points) >= Number(cost);
  }

  // ---------- 렌더 ----------
  function render(){
    const p = pointsGet();
    const inv = invGet();

    if ($pts) $pts.textContent = p;
    document.querySelectorAll('[data-soi-points]').forEach(el=>el.textContent = p);
    if ($inv) $inv.textContent = fmtInv(inv);

    if (!$grid) return;

    $grid.innerHTML = SHOP_ITEMS.map(item=>{
      const owned = !item.consumable && !!inv[item.id];
      const disabled = !canBuy(p, item.cost, owned, item.consumable);
      const btnText = owned ? '보유중' : '구매';
      const qtyInfo = item.consumable && item.qty ? ` <span class="shop-qty">×${item.qty}</span>` : '';
      const badge = owned ? `<span class="shop-badge">보유중</span>` : '';

      return `
        <article class="shop-card" data-id="${item.id}">
          <div class="shop-card-head">
            <h3 class="shop-card-title">${item.title}${qtyInfo}</h3>
            <div class="shop-card-right">
              ${badge}
              <span class="shop-card-cost">${item.cost}p</span>
            </div>
          </div>
          ${item.detail ? `<p class="shop-card-desc">${item.detail}</p>` : ''}
          <button class="btn btn-primary shop-buy" data-buy="${item.id}" ${disabled?'disabled':''}>
            ${btnText}
          </button>
        </article>
      `;
    }).join('');
  }

  // ---------- 구매 ----------
  function onClick(e){
    const btn = e.target.closest('.shop-buy');
    if (!btn) return;
    const id = btn.getAttribute('data-buy');

    const item = SHOP_ITEMS.find(x=>x.id===id);
    if (!item) return;

    const p = pointsGet();
    const inv = invGet();
    const owned = !item.consumable && !!inv[id];

    if (!canBuy(p, item.cost, owned, item.consumable)) {
      alert(owned ? '이미 보유 중이에요.' : '포인트가 부족해요!');
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

  // ---------- 초기화 ----------
  function onReady(){
    render();
    document.addEventListener('click', onClick);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();

  // 포인트/유저 변화 시 즉시 반영
  window.addEventListener('points:changed', render);
  window.addEventListener('storage', (ev)=>{ if (ev.key==='soi:points' || ev.key==='soi:inventory') render(); });
})();
