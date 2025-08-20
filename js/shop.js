// js/shop.js — 상점 최종본 (shop.html 전용 ID에 맞춤)
// - 포인트 표시:    #shop-points, [data-soi-points]
// - 인벤토리 표시:  #shop-inventory
// - 아이템 그리드:  #shop-items
// - 의존: soi-store.js (soi_pointsGet/Add, soi_inventoryGet/Set)

(function () {
  // --- Fallback(안전장치): 혹시 soi-store.js가 없더라도 최소 동작 ---
  const KEYS = { POINTS:'soi:points', INVENTORY:'soi:inventory' };
  function lsNumGet(k,d=0){ const v=localStorage.getItem(k); return v==null?d:Number(v); }
  function lsNumSet(k,n){ localStorage.setItem(k,String(n)); }
  function lsObjGet(k){ try{ return JSON.parse(localStorage.getItem(k)||'{}'); }catch{ return {}; } }
  function lsObjSet(k,o){ localStorage.setItem(k,JSON.stringify(o)); }

  const soi_pointsGet = (window.soi_pointsGet) || (() => lsNumGet(KEYS.POINTS,0));
  const soi_pointsAdd = (window.soi_pointsAdd) || ((delta) => {
    const v = soi_pointsGet() + Number(delta||0);
    lsNumSet(KEYS.POINTS, v);
    // 페이지 공통 뱃지 동기화
    document.querySelectorAll('[data-soi-points]').forEach(el => el.textContent = v);
    return v;
  });
  const soi_inventoryGet = (window.soi_inventoryGet) || (() => lsObjGet(KEYS.INVENTORY));
  const soi_inventorySet = (window.soi_inventorySet) || ((o) => lsObjSet(KEYS.INVENTORY, o));

  // --- 상점 아이템 정의(원하면 변경 가능) ---
  const SHOP_ITEMS = [
    { id:'theme_pink',   title:'핑크 테마',     cost:20,  consumable:false, detail:'화사한 핑크 테마' },
    { id:'theme_blue',   title:'블루 테마',     cost:20,  consumable:false, detail:'시원한 블루 테마' },
    { id:'sticker_star', title:'별 스티커 x5',  cost:10,  consumable:true,  qty:5, detail:'문제 풀이 보상에 붙이는 별' },
    { id:'sticker_heart',title:'하트 스티커 x5',cost:10,  consumable:true,  qty:5, detail:'칭찬할 때 붙이는 하트' },
  ];

  // --- DOM 훅 ---
  const elPoints = document.getElementById('shop-points');
  const elInv    = document.getElementById('shop-inventory');
  const elGrid   = document.getElementById('shop-items');

  function formatInventory(inv){
    const ids = Object.keys(inv);
    if (!ids.length) return '없음';
    return ids.map(id => {
      const v = inv[id];
      const qty = (typeof v === 'number') ? v : (v === true ? '보유' : JSON.stringify(v));
      return `${id}: ${qty}`;
    }).join(', ');
  }

  function render() {
    // 포인트 표시
    const points = soi_pointsGet();
    if (elPoints) elPoints.textContent = points;
    document.querySelectorAll('[data-soi-points]').forEach(el => el.textContent = points);

    // 인벤토리 표시
    const inv = soi_inventoryGet();
    if (elInv) elInv.textContent = formatInventory(inv);

    // 아이템 카드 렌더
    if (elGrid) {
      elGrid.innerHTML = SHOP_ITEMS.map(item => `
        <article style="border:1px solid #e5e5e5;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h3 style="margin:0;font-size:16px;">${item.title}</h3>
            <span style="font-weight:700">${item.cost}p</span>
          </div>
          <p style="margin:0;color:#666;font-size:13px;">${item.detail||''}</p>
          <button data-buy="${item.id}" ${points < item.cost ? 'disabled' : ''} 
                  style="margin-top:6px;padding:8px;border-radius:10px;border:1px solid #ddd;cursor:pointer;">
            구매
          </button>
        </article>
      `).join('');
    }
  }

  // 구매 처리
  function onClick(e){
    const btn = e.target.closest('button[data-buy]');
    if (!btn) return;
    const id = btn.getAttribute('data-buy');
    const item = SHOP_ITEMS.find(x => x.id === id);
    if (!item) return;

    const points = soi_pointsGet();
    if (points < item.cost) {
      alert('포인트가 부족해요!');
      return;
    }

    // 포인트 차감
    soi_pointsAdd(-item.cost);

    // 인벤토리 업데이트
    const inv = soi_inventoryGet();
    if (item.consumable) {
      inv[item.id] = (inv[item.id] || 0) + (item.qty || 1);
    } else {
      inv[item.id] = true;
    }
    soi_inventorySet(inv);

    alert('구매 완료!');
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    render();
    document.addEventListener('click', onClick);
  });
})();
