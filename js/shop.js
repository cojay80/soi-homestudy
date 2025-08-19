// js/shop.js — 상점(포인트 사용, 보상 인벤토리)

document.addEventListener('DOMContentLoaded', () => {
  bootShop().catch(e => {
    console.error('[shop boot failed]', e);
    alert('상점을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.');
  });
});

const Shop = {
  catalog: [
    { id:'snack', name:'과자/음료',         price:  50, desc:'작은 간식' },
    { id:'tv',    name:'TV 시청권 (30분)',   price: 120, desc:'TV 30분' },
    { id:'free',  name:'자유시간 (30분)',    price: 180, desc:'자유시간 30분' },
    { id:'kids',  name:'키즈방 (1시간)',     price: 300, desc:'키즈카페 느낌' },
    { id:'gift',  name:'상품권 (소액)',       price: 500, desc:'현금처럼 사용' },
    { id:'park',  name:'주말 놀이공원',      price:2000, desc:'대형 보상' },
  ]
};

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

async function bootShop(){
  const name = (localStorage.getItem('soi_name') || '').trim();
  const isIndex = /(^|\/)index\.html?$/.test(location.pathname) || location.pathname === '/' || location.pathname === '';
  if (!name && !isIndex) location.href = 'index.html';

  await ensureStoreReady();
  let user = await window.SoiStore.currentUser();
  if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
  const uid = user.uid;

  let doc = await window.SoiStore.getUserDoc(uid);
  doc.points  ||= 0;
  doc.rewards ||= {};

  renderShop(doc, uid);
}

function renderShop(doc, uid){
  const $pts   = document.getElementById('shop-points');
  const $inv   = document.getElementById('shop-inventory');
  const $items = document.getElementById('shop-items');

  if ($pts) $pts.textContent = String(doc.points || 0);
  if ($inv) {
    const list = Object.entries(doc.rewards||{})
      .filter(([,cnt]) => (cnt||0) > 0)
      .map(([k,cnt]) => `${toName(k)} x ${cnt}`);
    $inv.textContent = list.length ? list.join(', ') : '없음';
  }

  if ($items) {
    $items.innerHTML = '';
    Shop.catalog.forEach(item => {
      const card = document.createElement('div');
      card.className = 'shop-card';
      card.style.cssText = 'border:1px solid #ddd;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px;background:#fff;';
      card.innerHTML = `
        <div style="font-weight:700;">${item.name}</div>
        <div style="color:#666;">${item.desc}</div>
        <div><b>가격:</b> ${item.price} 포인트</div>
        <button class="buy-btn" data-id="${item.id}" style="padding:8px 10px;border-radius:8px;border:0;background:#4f46e5;color:#fff;cursor:pointer;">
          구매하기
        </button>
      `;
      $items.appendChild(card);
    });

    $items.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        await buyItem(uid, id);
      });
    });
  }
}

function toName(id){
  const found = Shop.catalog.find(i => i.id === id);
  return found ? found.name : id;
}

async function buyItem(uid, itemId){
  let doc = await window.SoiStore.getUserDoc(uid);
  doc.points  ||= 0;
  doc.rewards ||= {};
  const item = Shop.catalog.find(i => i.id === itemId);
  if (!item) return alert('알 수 없는 아이템입니다.');

  if ((doc.points||0) < item.price) {
    alert('포인트가 부족해요!');
    return;
  }
  const nextPts = (doc.points||0) - item.price;
  const nextInv = { ...(doc.rewards||{}) };
  nextInv[itemId] = (nextInv[itemId]||0) + 1;

  doc = await window.SoiStore.setUserDoc(uid, { ...doc, points: nextPts, rewards: nextInv });
  await window.SoiStore.pushLog(uid, { source:'상점', action:'buy', tier:'spend', points:-item.price, couponName:itemId });

  renderShop(doc, uid);
  alert(`${item.name}을(를) 구매했어요!`);
}
