// js/home.js — 홈(빠른 시작/오늘 진행/복습 버튼) 최종본
// 사용 로컬키: selectedGrade, selectedSubject, selectedCount, selectedTimer, studyData[currentUser].records

(function(){
  const $  = (id) => document.getElementById(id);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function getLSJSON(key, def){
    try{ const s = localStorage.getItem(key); return s==null? def : JSON.parse(s); }
    catch{ return def; }
  }
  function todayStr(dt=new Date()){
    const y=dt.getFullYear(), m=String(dt.getMonth()+1).padStart(2,'0'), d=String(dt.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  function parseScore(s){
    const m = String(s||'').match(/(\d+)\s*\/\s*(\d+)/);
    return m ? {correct:+m[1], total:+m[2]} : {correct:0, total:0};
  }

  function initQuickStart(){
    const gSel = $('sel-grade');
    const sSel = $('sel-subject');
    const cnt  = $('sel-count');
    const tmr  = $('sel-timer');
    const msg  = $('home-msg');

    // 이전 설정 복원
    const g = localStorage.getItem('selectedGrade') || '';
    const s = localStorage.getItem('selectedSubject') || '';
    const c = localStorage.getItem('selectedCount') || '10';
    const t = localStorage.getItem('selectedTimer') || '0';
    if (g) gSel.value = g;
    if (s) sSel.value = s;
    cnt.value = c;
    tmr.value = t;

    $('btn-start').addEventListener('click', () => {
      const grade = gSel.value.trim();
      const subject = sSel.value.trim();
      const count = Math.max(1, parseInt(cnt.value||'10',10));
      const timer = Math.max(0, parseInt(tmr.value||'0',10));
      if (!grade || !subject){
        msg.textContent = '학년과 과목을 먼저 선택해 주세요.';
        return;
      }
      // 저장
      localStorage.setItem('selectedGrade', grade);
      localStorage.setItem('selectedSubject', subject);
      localStorage.setItem('selectedCount', String(count));
      localStorage.setItem('selectedTimer', String(timer));
      // 시작
      location.href = 'quiz.html';
    });

    $('btn-review').addEventListener('click', () => {
      const u = localStorage.getItem('currentUser');
      const sd = getLSJSON('studyData', {});
      const wrongs = (u && sd[u] && Array.isArray(sd[u].incorrect)) ? sd[u].incorrect : [];
      if (!wrongs.length){
        msg.textContent = '복습할 오답이 없습니다.';
        setTimeout(()=> msg.textContent = '', 1500);
        return;
      }
      localStorage.setItem('isReviewMode', 'true');
      localStorage.setItem('reviewProblems', JSON.stringify(wrongs));
      location.href = 'quiz.html';
    });
  }

  function renderToday(){
    // 포인트 뱃지 즉시 반영
    $$('[data-soi-points]').forEach(el => el.textContent = localStorage.getItem('soi:points') || '0');

    const u = localStorage.getItem('currentUser');
    const sd = getLSJSON('studyData', {});
    const recs = (u && sd[u] && Array.isArray(sd[u].records)) ? sd[u].records : [];

    const today = todayStr();
    let tTotal = 0, tCorrect = 0;
    let recentText = '—';

    // 최근 세션
    if (recs.length){
      const last = recs[recs.length-1];
      const s = parseScore(last.score);
      recentText = `${last.date} · ${last.grade||'-'} ${last.subject||'-'} · ${s.correct}/${s.total} (${Math.round(s.total? s.correct/s.total*100:0)}%)`;
    }

    recs.forEach(r => {
      if (r.date === today){
        const s = parseScore(r.score);
        tTotal += s.total;
        tCorrect += s.correct; // 정책상 정답=+1p, 오늘 포인트로 동일시
      }
    });

    $('today-total').textContent = tTotal;
    $('today-correct').textContent = tCorrect;
    $('recent-session').textContent = recentText;

    // 진행률 바(오늘 문항 / 일일목표)
    const goals = (function(){
      try{
        const all = JSON.parse(localStorage.getItem('soi:goals')||'{}');
        const key = localStorage.getItem('currentUser') || '_anonymous';
        const g = all[key] && all[key].daily ? all[key].daily : {questions:20};
        return g;
      }catch{ return {questions:20}; }
    })();
    const dq = Math.max(1, parseInt(goals.questions||'20',10));
    $('bar-today').style.width = Math.min(100, Math.round((tTotal/dq)*100)) + '%';
  }

  document.addEventListener('DOMContentLoaded', () => {
    initQuickStart();
    renderToday();
  });
})();
