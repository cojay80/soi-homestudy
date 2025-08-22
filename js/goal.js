// js/goal.js — 목표 설정/집계/보상 최종본
// 저장 키:
//   - 'soi:goals' : 사용자별 목표 설정/달성 상태
//   - 'soi:points' : 누적 포인트 (soi-store.js/quiz.js가 관리)
//   - 'studyData[currentUser].records' : quiz.js가 저장하는 세션 기록 (date, grade, subject, score "x/y")

(function () {
  const $  = (id) => document.getElementById(id);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const KEYS = {
    GOALS: 'soi:goals',
    POINTS: 'soi:points',
  };

  // ----- 유틸 -----
  function getLSJSON(key, def){
    try{ const s = localStorage.getItem(key); return s==null? def : JSON.parse(s); }
    catch{ return def; }
  }
  function setLSJSON(key, val){
    localStorage.setItem(key, JSON.stringify(val));
  }
  function todayStr(dt=new Date()){
    const y=dt.getFullYear(), m=String(dt.getMonth()+1).padStart(2,'0'), d=String(dt.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  function startOfWeek(dt=new Date()){ // 월요일 시작
    const c = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const day = (c.getDay()+6)%7; // 0=월 ... 6=일
    c.setDate(c.getDate()-day);
    c.setHours(0,0,0,0);
    return c;
  }
  function endOfWeek(dt=new Date()){
    const s = startOfWeek(dt);
    const e = new Date(s.getTime()+6*24*60*60*1000);
    e.setHours(23,59,59,999);
    return e;
  }
  function weekKey(dt=new Date()){ // 주간 보상 식별용 키
    const s = startOfWeek(dt);
    const y=s.getFullYear(), m=String(s.getMonth()+1).padStart(2,'0'), d=String(s.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`; // 주 시작일로 식별
  }
  function parseScore(str){
    const m = String(str||'').match(/(\d+)\s*\/\s*(\d+)/);
    if(!m) return {correct:0,total:0};
    return {correct:Number(m[1]), total:Number(m[2])};
  }
  function clamp01(n){ return Math.max(0, Math.min(1, n)); }
  function pctStr(n){ return (isFinite(n) ? Math.round(n) : 0) + '%'; }

  function soiPoints(){
    return Number(localStorage.getItem(KEYS.POINTS)||'0');
  }
  function pointsAdd(n){
    if (window.soi_pointsAdd) return window.soi_pointsAdd(n);
    // fallback
    const v = soiPoints() + Number(n||0);
    localStorage.setItem(KEYS.POINTS, String(v));
    // 뱃지 동기화
    $$('[data-soi-points]').forEach(el => el.textContent = v);
    return v;
  }
  function invAdd(id, qtyOrTrue=true){
    if (window.soi_inventoryGet && window.soi_inventorySet){
      const inv = window.soi_inventoryGet();
      if (qtyOrTrue === true) inv[id] = true;
      else inv[id] = (inv[id]||0) + Number(qtyOrTrue||1);
      window.soi_inventorySet(inv);
    } else {
      const key = 'soi:inventory';
      const inv = getLSJSON(key,{});
      if (qtyOrTrue === true) inv[id] = true;
      else inv[id] = (inv[id]||0) + Number(qtyOrTrue||1);
      setLSJSON(key, inv);
    }
  }

  // ----- 목표 저장/로드 (사용자별) -----
  function loadGoals(){
    const u = localStorage.getItem('currentUser') || '_anonymous';
    const all = getLSJSON(KEYS.GOALS, {});
    const g = all[u] || {};
    // 기본값 + 상태
    g.daily = g.daily || {
      questions:20, points:10,
      lastDate: null,                  // yyyy-mm-dd
      achieved: { questions:false, points:false }
    };
    g.weekly = g.weekly || {
      sessions:7, acc:70,
      weekKey: null,                   // 주 시작일 yyyy-mm-dd
      achieved: { sessions:false, acc:false }
    };
    return { all, u, g };
  }
  function saveGoals(wrap){
    const {all, u, g} = wrap;
    all[u] = g;
    setLSJSON(KEYS.GOALS, all);
  }

  // ----- UI 바인딩 -----
  function bindUI(){
    // 포인트 뱃지 즉시 반영
    $$('[data-soi-points]').forEach(el => el.textContent = soiPoints());

    const wrap = loadGoals();
    const g = wrap.g;

    // 입력 채우기
    $('goal-daily-questions').value = g.daily.questions ?? 20;
    $('goal-daily-points').value    = g.daily.points ?? 10;
    $('goal-weekly-sessions').value = g.weekly.sessions ?? 7;
    $('goal-weekly-acc').value      = g.weekly.acc ?? 70;

    // 버튼
    $('btn-goal-save').addEventListener('click', () => {
      g.daily.questions = Math.max(0, parseInt($('goal-daily-questions').value||'0',10));
      g.daily.points    = Math.max(0, parseInt($('goal-daily-points').value||'0',10));
      g.weekly.sessions = Math.max(0, parseInt($('goal-weekly-sessions').value||'0',10));
      g.weekly.acc      = Math.max(0, Math.min(100, parseInt($('goal-weekly-acc').value||'0',10)));

      saveGoals(wrap);
      const st = $('goal-save-state');
      st.textContent = '저장됨';
      setTimeout(()=> st.textContent='', 1500);

      // 저장 직후 재집계
      computeAndRender();
    });

    $('btn-goal-reset').addEventListener('click', () => {
      // 🔧 리스너 중복 방지를 위해 bindUI() 재호출 대신 값만 재설정 + 재집계
      g.daily  = { questions:20, points:10, lastDate:null, achieved:{questions:false, points:false} };
      g.weekly = { sessions:7,  acc:70,   weekKey:null,  achieved:{sessions:false, acc:false} };
      saveGoals(wrap);

      // 입력값만 갱신
      $('goal-daily-questions').value = g.daily.questions;
      $('goal-daily-points').value    = g.daily.points;
      $('goal-weekly-sessions').value = g.weekly.sessions;
      $('goal-weekly-acc').value      = g.weekly.acc;

      // 화면 수치 재계산
      computeAndRender();
    });

    // 초기 집계
    computeAndRender();
  }

  // ----- 집계 & 보상 -----
  function computeAndRender(){
    const wrap = loadGoals();
    const g = wrap.g;

    // 기록 읽기
    const sd = getLSJSON('studyData', {});
    const u = localStorage.getItem('currentUser');
    const records = (u && sd[u] && Array.isArray(sd[u].records)) ? sd[u].records : [];

    const today = todayStr();
    const sWeek = startOfWeek(); const eWeek = endOfWeek(); const wKey = weekKey();

    // 일일 상태 초기화(날짜 바뀌면 리셋)
    if (g.daily.lastDate !== today){
      g.daily.lastDate = today;
      g.daily.achieved = { questions:false, points:false };
    }
    // 주간 상태 초기화(주가 바뀌면 리셋)
    if (g.weekly.weekKey !== wKey){
      g.weekly.weekKey = wKey;
      g.weekly.achieved = { sessions:false, acc:false };
    }

    // 오늘 집계
    let todayQuestions = 0;
    let todayCorrectSum = 0; // 정답수 == 포인트(+1/정답) 정책 기준
    // 주간 집계
    let weekSessions = 0;
    let weekTotal = 0;
    let weekCorrect = 0;

    records.forEach(r => {
      const {correct,total} = parseScore(r.score);
      // 오늘
      if (r.date === today) {
        todayQuestions += total;
        todayCorrectSum += correct;
      }
      // 주간
      const d = new Date(r.date+'T00:00:00');
      if (d >= sWeek && d <= eWeek) {
        weekSessions += 1;
        weekTotal += total;
        weekCorrect += correct;
      }
    });
    const todayPoints = todayCorrectSum;
    const weekAcc = weekTotal ? (weekCorrect/weekTotal)*100 : 0;

    // 목표값
    const gDQ = g.daily.questions || 0;
    const gDP = g.daily.points || 0;
    const gWS = g.weekly.sessions || 0;
    const gWA = g.weekly.acc || 0;

    // 진행률 표시
    $('today-questions').textContent = todayQuestions;
    $('today-questions-goal').textContent = gDQ;
    $('today-points').textContent = todayPoints;
    $('today-points-goal').textContent = gDP;
    $('week-sessions').textContent = weekSessions;
    $('week-sessions-goal').textContent = gWS;
    $('week-acc').textContent = pctStr(weekAcc);
    $('week-acc-goal').textContent = pctStr(gWA);

    // 바 길이
    $('bar-today-questions').style.width = (Math.round(clamp01(gDQ? todayQuestions/gDQ : 0)*100)) + '%';
    $('bar-today-points').style.width    = (Math.round(clamp01(gDP? todayPoints/gDP : 0)*100)) + '%';
    $('bar-week-sessions').style.width   = (Math.round(clamp01(gWS? weekSessions/gWS : 0)*100)) + '%';
    $('bar-week-acc').style.width        = (Math.round(clamp01(gWA? weekAcc/gWA : 0)*100)) + '%';

    // 달성 상태 텍스트
    const dailyQOk = todayQuestions >= gDQ && gDQ > 0;
    const dailyPOk = todayPoints   >= gDP && gDP > 0;
    const weekSOk  = weekSessions  >= gWS && gWS > 0;
    const weekAOk  = weekAcc       >= gWA && gWA > 0;

    $('state-daily-questions').innerHTML = dailyQOk
      ? '일일 문항: <span class="ok">달성</span>' : '일일 문항: 진행 중';
    $('state-daily-points').innerHTML = dailyPOk
      ? '일일 포인트: <span class="ok">달성</span>' : '일일 포인트: 진행 중';
    $('state-week-sessions').innerHTML = weekSOk
      ? '주간 세션: <span class="ok">달성</span>' : '주간 세션: 진행 중';
    $('state-week-acc').innerHTML = weekAOk
      ? '주간 정답률: <span class="ok">달성</span>' : '주간 정답률: 진행 중';

    // ----- 보상 지급 (최초 1회) -----
    let awardedMsgs = [];

    // 일일 문항 달성 → +2p, 별 스티커 +1
    if (dailyQOk && !g.daily.achieved.questions){
      g.daily.achieved.questions = true;
      pointsAdd(2);
      invAdd('sticker_star', 1);
      awardedMsgs.push('일일 문항 달성: +2p, 별 스티커 +1');
    }
    // 일일 포인트 달성 → +3p, 하트 스티커 +1
    if (dailyPOk && !g.daily.achieved.points){
      g.daily.achieved.points = true;
      pointsAdd(3);
      invAdd('sticker_heart', 1);
      awardedMsgs.push('일일 포인트 달성: +3p, 하트 스티커 +1');
    }
    // 주간 세션 달성 → +5p, 실버 배지 1개(보유)
    if (weekSOk && !g.weekly.achieved.sessions){
      g.weekly.achieved.sessions = true;
      pointsAdd(5);
      invAdd('badge_silver', true);
      awardedMsgs.push('주간 세션 달성: +5p, 실버 배지');
    }
    // 주간 정답률 달성 → +5p, 골드 배지 1개(보유)
    if (weekAOk && !g.weekly.achieved.acc){
      g.weekly.achieved.acc = true;
      pointsAdd(5);
      invAdd('badge_gold', true);
      awardedMsgs.push('주간 정답률 달성: +5p, 골드 배지');
    }

    // 저장 + 알림 + 상단 뱃지 동기화
    saveGoals(wrap);
    if (awardedMsgs.length){
      $$('[data-soi-points]').forEach(el => el.textContent = soiPoints());
      alert('축하합니다! 🎉\n' + awardedMsgs.join('\n'));
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // 포인트 뱃지 즉시 반영
    $$('[data-soi-points]').forEach(el => el.textContent = soiPoints());
    bindUI();
  });
})();
