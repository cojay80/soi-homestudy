// js/report.js — 최근 7일 리포트 최종본
// 데이터 출처:
//  - quiz.js가 저장하는 localStorage.studyData[currentUser].records (date, grade, subject, score("x/y"))
//  - 누적 포인트: localStorage['soi:points']

(function () {
  function getLS(key, def) {
    try { const v = localStorage.getItem(key); return v==null ? def : JSON.parse(v); }
    catch { return def; }
  }
  function fmtPct(n){ return isFinite(n) ? Math.round(n) + '%' : '0%'; }
  function clamp01(n){ return Math.max(0, Math.min(1, n)); }

  function parseScore(scoreStr){
    // "x/y" → {correct:x, total:y}
    if(!scoreStr) return {correct:0,total:0};
    const m = String(scoreStr).match(/(\d+)\s*\/\s*(\d+)/);
    if(!m) return {correct:0,total:0};
    return {correct:Number(m[1]), total:Number(m[2])};
  }

  function parseDateStr(s) {
    // "YYYY-MM-DD"
    const [y,m,d] = String(s||'').split('-').map(Number);
    if(!y||!m||!d) return null;
    return new Date(y, m-1, d, 0,0,0,0);
  }

  function ymd(dt){
    const y=dt.getFullYear(), m=String(dt.getMonth()+1).padStart(2,'0'), d=String(dt.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }

  function renderBars(container, items, valueKey, labelKey, suffix='') {
    if(!items.length){ container.textContent = '데이터 없음'; return; }
    const max = Math.max(...items.map(it => it[valueKey] || 0), 1);
    container.innerHTML = items.map(it => {
      const val = it[valueKey] || 0;
      const pct = Math.round(clamp01(val / max) * 100);
      return `
        <div style="margin:6px 0">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span><b>${it[labelKey]}</b></span>
            <span class="mini">${val}${suffix}</span>
          </div>
          <div class="barwrap"><div class="bar" style="width:${pct}%"></div></div>
        </div>
      `;
    }).join('');
  }

  function buildReport() {
    const currentUser = localStorage.getItem('currentUser');
    const studyData = getLS('studyData', {});
    const userData = studyData && currentUser ? (studyData[currentUser] || {}) : {};
    const records = Array.isArray(userData.records) ? userData.records : [];

    // 범위: 최근 7일
    const end = new Date(); end.setHours(23,59,59,999);
    const start = new Date(end.getTime() - 6*24*60*60*1000); start.setHours(0,0,0,0);

    const within7d = records.filter(r => {
      const dt = parseDateStr(r.date);
      return dt && dt >= start && dt <= end;
    });

    // KPI 계산
    let total = 0, correct = 0;
    within7d.forEach(r => {
      const s = parseScore(r.score);
      total += s.total;
      correct += s.correct;
    });
    const acc = total ? (correct/total)*100 : 0;

    const points = Number(localStorage.getItem('soi:points') || '0');
    const sessions = within7d.length;

    // DOM 반영
    const $ = (id) => document.getElementById(id);
    $('kpi-total').textContent   = String(total);
    $('kpi-acc').textContent     = fmtPct(acc);
    $('kpi-points').textContent  = points + 'p';
    $('kpi-sessions').textContent= String(sessions);
    $('range-label').textContent = `기간: ${ymd(start)} ~ ${ymd(end)}`;

    // 과목별 정답률
    const bySubject = {};
    within7d.forEach(r => {
      const s = parseScore(r.score);
      const key = r.subject || '미지정';
      if(!bySubject[key]) bySubject[key] = {subject:key, correct:0, total:0};
      bySubject[key].correct += s.correct;
      bySubject[key].total   += s.total;
    });
    const subjectArr = Object.values(bySubject).map(it => ({
      subject: it.subject,
      acc: it.total ? Math.round((it.correct/it.total)*100) : 0
    })).sort((a,b)=> b.acc-a.acc);

    // 학년별 풀이 수
    const byGrade = {};
    within7d.forEach(r => {
      const s = parseScore(r.score);
      const key = r.grade || '미지정';
      if(!byGrade[key]) byGrade[key] = {grade:key, count:0};
      byGrade[key].count += s.total;
    });
    const gradeArr = Object.values(byGrade).sort((a,b)=> b.count-a.count);

    renderBars($('subject-bars'), subjectArr, 'acc', 'subject', '%');
    renderBars($('grade-bars'), gradeArr, 'count', 'grade', '문항');

    // 세션 테이블
    const body = $('session-body');
    if (!within7d.length) {
      body.innerHTML = `<tr><td colspan="6" class="mini">기록이 없습니다.</td></tr>`;
    } else {
      const rows = within7d
        .slice()
        .sort((a,b) => (parseDateStr(b.date) - parseDateStr(a.date)))
        .map(r => {
          const s = parseScore(r.score);
          const acc = s.total ? Math.round((s.correct/s.total)*100) : 0;
          return `
            <tr>
              <td>${r.date || '-'}</td>
              <td>${r.grade || '-'}</td>
              <td>${r.subject || '-'}</td>
              <td>${r.score || '-'}</td>
              <td>${s.correct}/${s.total}</td>
              <td>${acc}%</td>
            </tr>
          `;
        }).join('');
      body.innerHTML = rows;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // 포인트 뱃지 즉시 반영
    document.querySelectorAll('[data-soi-points]').forEach(el => el.textContent = localStorage.getItem('soi:points') || '0');
    buildReport();
  });
})();
