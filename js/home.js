// js/home.js — 홈(빠른 시작/오늘 진행/복습 버튼) 최종본(하드닝)
// 사용 로컬키: selectedGrade, selectedSubject, selectedCount, selectedTimer, studyData[currentUser].records

(function () {
  const $  = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function getLSJSON(key, def) {
    try { const s = localStorage.getItem(key); return s == null ? def : JSON.parse(s); }
    catch { return def; }
  }
  function todayStr(dt = new Date()) {
    const y = dt.getFullYear(), m = String(dt.getMonth() + 1).padStart(2, '0'), d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function parseScore(s) {
    const m = String(s || '').match(/(\d+)\s*\/\s*(\d+)/);
    return m ? { correct: +m[1], total: +m[2] } : { correct: 0, total: 0 };
  }
  function safeInt(v, def = 0) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : def;
  }

  function initQuickStart() {
    const gSel = $('sel-grade');
    const sSel = $('sel-subject');
    const cnt  = $('sel-count');
    const tmr  = $('sel-timer');
    const msg  = $('home-msg');

    // 필수 요소 없으면 조용히 종료 (다른 페이지 재사용 대비)
    if (!gSel || !sSel || !cnt || !tmr) return;

    // 이전 설정 복원
    const g = localStorage.getItem('selectedGrade')   || '';
    const s = localStorage.getItem('selectedSubject') || '';
    const c = localStorage.getItem('selectedCount')   || '10';
    const t = localStorage.getItem('selectedTimer')   || '0';
    if (g) gSel.value = g;
    if (s) sSel.value = s;
    cnt.value = c;
    tmr.value = t;

    const showMsg = (text) => {
      if (!msg) return;
      msg.textContent = text || '';
      if (text) setTimeout(() => { if (msg.textContent === text) msg.textContent = ''; }, 1800);
    };

    const btnStart  = $('btn-start');
    const btnReview = $('btn-review');

    if (btnStart) {
      btnStart.addEventListener('click', () => {
        const grade  = (gSel.value || '').trim();
        const subject= (sSel.value || '').trim();
        const count  = Math.max(1, safeInt(cnt.value || '10', 10));
        const timer  = Math.max(0, safeInt(tmr.value || '0', 0));

        if (!grade || !subject) {
          showMsg('학년과 과목을 먼저 선택해 주세요.');
          return;
        }
        // 저장
        localStorage.setItem('selectedGrade', grade);
        localStorage.setItem('selectedSubject', subject);
        localStorage.setItem('selectedCount', String(count));
        localStorage.setItem('selectedTimer', String(timer));
        // 리뷰 모드 흔적 정리
        localStorage.removeItem('isReviewMode');
        localStorage.removeItem('reviewProblems');

        // 시작
        location.href = 'quiz.html';
      });
    }

    if (btnReview) {
      btnReview.addEventListener('click', () => {
        const u  = localStorage.getItem('currentUser');
        const sd = getLSJSON('studyData', {});
        const wrongs = (u && sd[u] && Array.isArray(sd[u].incorrect)) ? sd[u].incorrect : [];
        if (!wrongs.length) {
          showMsg('복습할 오답이 없습니다.');
          return;
        }
        localStorage.setItem('isReviewMode', 'true');
        localStorage.setItem('reviewProblems', JSON.stringify(wrongs));
        location.href = 'quiz.html';
      });
    }
  }

  function renderToday() {
    // 포인트 뱃지 즉시 반영 (없어도 조용히)
    const pts = localStorage.getItem('soi:points') || '0';
    $$('[data-soi-points]').forEach((el) => (el.textContent = pts));

    const u  = localStorage.getItem('currentUser');
    const sd = getLSJSON('studyData', {});
    const recs = (u && sd[u] && Array.isArray(sd[u].records)) ? sd[u].records : [];

    const today = todayStr();
    let tTotal = 0, tCorrect = 0;
    let recentText = '—';

    if (recs.length) {
      const last = recs[recs.length - 1];
      const s = parseScore(last.score);
      recentText = `${last.date} · ${last.grade || '-'} ${last.subject || '-'} · ${s.correct}/${s.total} (${Math.round(s.total ? (s.correct / s.total) * 100 : 0)}%)`;
    }

    recs.forEach((r) => {
      if (r.date === today) {
        const s = parseScore(r.score);
        tTotal   += s.total;
        tCorrect += s.correct; // 정책상 정답=+1p → 오늘 포인트 근사치
      }
    });

    const elTotal   = $('today-total');
    const elCorrect = $('today-correct');
    const elRecent  = $('recent-session');
    if (elTotal)   elTotal.textContent = tTotal;
    if (elCorrect) elCorrect.textContent = tCorrect;
    if (elRecent)  elRecent.textContent = recentText;

    // 진행률 바(오늘 문항 / 일일목표)
    const goals = (function () {
      try {
        const all = JSON.parse(localStorage.getItem('soi:goals') || '{}');
        const key = localStorage.getItem('currentUser') || '_anonymous';
        const g   = all[key] && all[key].daily ? all[key].daily : { questions: 20 };
        return g;
      } catch { return { questions: 20 }; }
    })();

    const dq = Math.max(1, safeInt(goals.questions || '20', 20));
    const bar = $('bar-today');
    if (bar) bar.style.width = Math.min(100, Math.round((tTotal / dq) * 100)) + '%';
  }

  document.addEventListener('DOMContentLoaded', () => {
    initQuickStart();
    renderToday();
  });
})();
