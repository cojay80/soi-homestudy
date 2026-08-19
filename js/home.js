// js/home.js — 홈(빠른 시작/오늘 진행/복습 버튼) 최종본(v3)
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function getLSJSON(key, def) {
    try {
      const s = localStorage.getItem(key);
      return s == null ? def : JSON.parse(s);
    } catch {
      return def;
    }
  }

  function todayStr(dt = new Date()) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
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

  // 메시지 표시 함수
  function showMessage(text, type = 'info') {
    const msgEl = $('home-msg');
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = `message-area ${type}`;
    setTimeout(() => {
      if (msgEl.textContent === text) {
        msgEl.textContent = '';
        msgEl.className = 'message-area';
      }
    }, 3000);
  }

  // 애니메이션 초기화
  function initAnimations() {
    // Stat pills pop animation
    const popItems = $$('.stat-pill, .drawer-item');
    popItems.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      setTimeout(() => {
        el.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * 100);
    });

    if (window.initAnimations) {
      window.initAnimations();
    }
  }

  async function initQuickStart() {
    const gSel = $('sel-grade');
    const sSel = $('sel-subject');
    const cnt = $('sel-count');
    const tmr = $('sel-timer');

    if (!gSel || !sSel) return;

    try {
      if (!window.API || !window.API.problems) throw new Error('API ready check failed');
      const text = await window.API.problems();
      const raw = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const lines = raw.split('\n').filter(l => l.trim().length > 0);

      if (lines.length > 0) {
        const head = lines[0];
        const delim = (head.match(/\t/g) || []).length >= (head.match(/,/g) || []).length ? '\t' : ',';
        const H = head.split(delim).map(h => h.trim());
        const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const gi = H.findIndex(h => ['학년', 'grade'].includes(norm(h)));
        const si = H.findIndex(h => ['과목', 'subject'].includes(norm(h)));

        if (gi >= 0 && si >= 0) {
          const grades = new Set();
          const subjectsByGrade = new Map();

          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(delim);
            const g = (cols[gi] || '').trim();
            const s = (cols[si] || '').trim();
            if (!g || !s) continue;
            grades.add(g);
            if (!subjectsByGrade.has(g)) subjectsByGrade.set(g, new Set());
            subjectsByGrade.get(g).add(s);
          }

          const gradeList = [...grades].sort((a, b) => a.localeCompare(b, 'ko'));
          gSel.innerHTML = ['<option value="">학년 선택</option>']
            .concat(gradeList.map(g => `<option value="${g}">${g}</option>`)).join('');

          const fillSubjects = (grade) => {
            const subs = subjectsByGrade.get(grade) ? [...subjectsByGrade.get(grade)] : [];
            subs.sort((a, b) => a.localeCompare(b, 'ko'));
            sSel.innerHTML = ['<option value="">과목 선택</option>']
              .concat(subs.map(s => `<option value="${s}">${s}</option>`)).join('');
          };

          gSel.addEventListener('change', () => {
            fillSubjects(gSel.value);
            localStorage.setItem('selectedGrade', gSel.value || '');
            localStorage.setItem('selectedSubject', '');
          });

          sSel.addEventListener('change', () => {
            localStorage.setItem('selectedSubject', sSel.value || '');
          });

          // 복원
          const prevG = localStorage.getItem('selectedGrade') || '';
          const prevS = localStorage.getItem('selectedSubject') || '';
          if (prevG && gradeList.includes(prevG)) {
            gSel.value = prevG;
            fillSubjects(prevG);
            if (prevS) sSel.value = prevS;
          }
        }
      }
    } catch (e) {
      console.error('[home] Init error:', e);
      showMessage('데이터를 불러오지 못했습니다.', 'error');
    }

    const btnStart = $('btn-start');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        const grade = gSel.value;
        const subject = sSel.value;
        if (!grade || !subject) {
          showMessage('학년과 과목을 선택해 주세요.', 'warning');
          return;
        }
        localStorage.setItem('selectedGrade', grade);
        localStorage.setItem('selectedSubject', subject);
        localStorage.setItem('selectedCount', cnt ? cnt.value : '10');
        localStorage.setItem('selectedTimer', tmr ? tmr.value : '0');
        localStorage.removeItem('isReviewMode');
        location.href = 'quiz.html';
      });
    }

    const btnReview = $('btn-review');
    if (btnReview) {
      btnReview.addEventListener('click', () => {
        const u = localStorage.getItem('currentUser') || 'soi';
        const sd = getLSJSON('studyData', {});
        const wrongs = (sd[u] && sd[u].incorrect) || [];
        if (!wrongs.length) {
          showMessage('복습할 오답이 없습니다.', 'info');
          return;
        }
        localStorage.setItem('isReviewMode', 'true');
        location.href = 'quiz.html';
      });
    }
  }

  function renderStats() {
    const user = localStorage.getItem('currentUser') || 'soi';
    const studyData = getLSJSON('studyData', {});
    const userData = studyData[user] || {};
    const today = todayStr();
    const recs = userData.records || [];

    let tTotal = 0, tCorrect = 0;
    recs.forEach(r => {
      if (r.date === today) {
        const s = parseScore(r.score);
        tTotal += s.total;
        tCorrect += s.correct;
      }
    });

    if ($('today-total')) $('today-total').textContent = tTotal;
    if ($('today-correct')) $('today-correct').textContent = tCorrect;

    const pts = userData.totalPoints || localStorage.getItem('soi:points') || '0';
    if ($('total-points')) $('total-points').textContent = Number(pts).toLocaleString();

    // Progress
    const goal = safeInt(localStorage.getItem('dailyGoal') || '10', 10);
    const progress = Math.min(100, (tTotal / goal) * 100);
    if ($('today-progress')) $('today-progress').textContent = Math.round(progress) + '%';
    if ($('goal-progress')) $('goal-progress').textContent = `${tTotal}/${goal}`;

    const circle = $('progress-circle');
    if (circle) {
      const radius = 45;
      const circumference = 2 * Math.PI * radius;
      circle.style.strokeDasharray = circumference;
      circle.style.strokeDashoffset = circumference * (1 - progress / 100);
    }

    // Recent
    const elRecent = $('recent-session');
    if (elRecent) {
      if (recs.length > 0) {
        const last = recs[recs.length - 1];
        elRecent.textContent = `${last.grade} ${last.subject}`;
      } else {
        elRecent.textContent = '아직 기록이 없어요';
      }
    }

    // Display Name
    const displayName = $('user-display-name');
    if (displayName) {
      displayName.textContent = user === 'soi' ? '소이' : user;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAnimations();
    initQuickStart();
    renderStats();
  });
})();
