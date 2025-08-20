// js/shop.js — 상점 아이템 구매/인벤토리 관리 최종본
// ------------------------------------------------------------
// quiz.js에 내장된 포인트/인벤토리 로직을 그대로 활용한다.
// (soi_pointsAdd, soi_pointsGet, soi_inventoryGet/Set 등)

const SHOP_ITEMS = [
  { id:'theme_pink',   title:'핑크 테마',     cost:20,  consumable:false },
  { id:'theme_blue',   title:'블루 테마',     cost:20,  consumable:false },
  { id:'sticker_star', title:'별 스티커 x5',  cost:10,  consumable:true, qty:5 },
  { id:'sticker_heart',title:'하트 스티커 x5',cost:10,  consumable:true, qty:5 }
];

// DOM 훅
const elShopList = document.getElementById('shop-list'); // <ul id="shop-list"></ul>
const elInvList  = document.getElementById('inv-list');  // <ul id="inv-list"></ul>

function renderShop() {
  const points = soi_pointsGet();
  document.querySelectorAll('[data-soi-points]').forEach(el => el.textContent = points);

  // 상점 아이템 목록
  elShopList.innerHTML = SHOP_ITEMS.map(i => `
    <li style="margin:.4rem 0; display:flex; gap:.5rem; align-items:center;">
      <div style="flex:1;">
        <div style="font-weight:600">${i.title}</div>
        <small>${i.cost}p</small>
      </div>
      <button data-buy="${i.id}" ${points < i.cost ? 'disabled' : ''}>구매</button>
    </li>
  `).join('');

  // 내 인벤토리
  const inv = soi_inventoryGet();
  const invItems = Object.keys(inv);
  elInvList.innerHTML = invItems.length ? invItems.map(id => {
    const v = inv[id];
    const qty = typeof v === 'number' ? v : (v === true ? '보유' : JSON.stringify(v));
    return `<li>${id} : ${qty}</li>`;
  }).join('') : '<li>아직 보상이 없습니다.</li>';
}

// 구매 처리
document.addEventListener('click', e => {
  const btn = e.target.closest('button[data-buy]');
  if(!btn) return;
  const id = btn.getAttribute('data-buy');
  const item = SHOP_ITEMS.find(x => x.id === id);
  if(!item) return;

  const points = soi_pointsGet();
  if(points < item.cost) return alert('포인트가 부족해요!');

  // 포인트 차감
  soi_pointsAdd(-item.cost);

  // 인벤토리에 추가
  const inv = soi_inventoryGet();
  if(item.consumable) {
    inv[item.id] = (inv[item.id] || 0) + (item.qty || 1);
  } else {
    inv[item.id] = true;
  }
  soi_inventorySet(inv);

  alert('구매 완료!');
  renderShop();
});

// 최초 렌더
document.addEventListener('DOMContentLoaded', renderShop);
