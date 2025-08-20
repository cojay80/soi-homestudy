// js/record.js — 상세 기록(필터/정렬/페이지/삭제/CSV) 최종본
// 데이터 출처: quiz.js가 저장한 localStorage.studyData[currentUser].records (date, grade, subject, score "x/y")

(function(){
  const $  = (id) => document.getElementById(id);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function getLSJSON(key, def){
    try{ const s = localStorage.getItem(key); return s==null? def : JSON.parse(s); }
    catch{ return def; }
  }
  function setLSJSON(key, v){ localStorage.setItem(key, JSON.stringify(v)); }
  function parseScore(s){
    const m = String(s||'').match(/(\d+)\s*\/\s*(\d+)/);
    return m ? {correct:+m[1], total:+m[2]} : {correct:0, total:0};
  }
  function pct(n){ return (isFinite(n)? Math.round(n) : 0) + '%'; }
  function ymd(dt){ const y=dt.getFullYear(), m=String(dt.getMonth()+1).padStart(2,'0'), d=String(dt.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; }

  // 상태
  let dataAll = [];     // 전체 레코드
  let dataView = [];    // 필터 반영된 레코드
  let sortAccDesc = true;
  let page = 1, pageSize = 20;

  // DOM
  const cbAll = $('cb-all');
  const fStart = $('f-start');
  const fEnd = $('f-end');
  const fGrade = $('f-grade');
  const fSubject = $('f-subject');
  const sumSessions = $('sum-sessions');
  const sumTotal = $('sum-total');
  const sumCorrect = $('sum-correct');
  const sumAcc = $('sum-acc');
  const body = $('rec-body');
  const pPrev = $('p-prev');
  const pNext = $('p-next');
  const pInfo = $('p-info');
  const pSize = $('p-size');

  function loadData(){
    // 포인트 뱃지 즉시 동기화
    $$('[data-soi-points]').forEach(el => el.textContent = localStorage.getItem('soi:points') || '0');

    const currentUser = localStorage.getItem('currentUser');
    const sd = getLSJSON('studyData', {});
    const records = (currentUser && sd[currentUser] && Array.isArray(sd[currentUser].records)) ? sd[currentUser].records : [];
    // 방어: 잘못된 값 제거
    dataAll = records.filter(r => r && r.date && r.score);
    // 필터용 옵션 채우기
    const grades = [...new Set(dataAll.map(r => r.grade).filter(Boolean))].sort();
    const subjects = [...new Set(dataAll.map(r => r.subject).filter(Boolean))].sort();
    fGrade.innerHTML = '<option value="">전체</option>' + grades.map(g=>`<option>${g}</option>`).join('');
    fSubject.innerHTML = '<option value="">전체</option>' + subjects.map(s=>`<option>${s}</option>`).join('');
  }

  function applyFilters(){
    const s = fStart.value ? new Date(fStart.value+'T00:00:00') : null;
    const e = fEnd.value ? new Date(fEnd.value+'T23:59:59') : null;
    const g = fGrade.value.trim();
    const sub = fSubject.value.trim();

    dataView = dataAll.filter(r => {
      const d = new Date(r.date+'T12:00:00');
      if (s && d < s) return false;
      if (e && d > e) return false;
      if (g && r.grade !== g) return false;
      if (sub && r.subject !== sub) return false;
      return true;
    });

    sortByAcc();
    page = 1;
    render();
  }

  function sortByAcc(){
    dataView.sort((a,b) => {
      const sa = parseScore(a.score), sb = parseScore(b.score);
      const pa = sa.total ? sa.correct/sa.total : 0;
      const pb = sb.total ? sb.correct/sb.total : 0;
      return sortAccDesc ? (pb - pa) : (pa - pb);
    });
  }

  function render(){
    // 합계
    const sums = dataView.reduce((acc,r)=>{
      const s = parseScore(r.score);
      acc.sessions += 1;
      acc.total += s.total;
      acc.correct += s.correct;
      return acc;
    }, {sessions:0,total:0,correct:0});
    const accPct = sums.total ? (sums.correct/sums.total)*100 : 0;
    sumSessions.textContent = sums.sessions;
    sumTotal.textContent = sums.total;
    sumCorrect.textContent = sums.correct;
    sumAcc.textContent = pct(accPct);

    // 페이지
    const totalPages = Math.max(1, Math.ceil(dataView.length / pageSize));
    if (page > totalPages) page = totalPages;
    const start = (page-1)*pageSize;
    const rows = dataView.slice(start, start+pageSize);

    if (!rows.length){
      body.innerHTML = `<tr><td colspan="7" class="mini">기록이 없습니다.</td></tr>`;
    } else {
      body.innerHTML = rows.map((r, idx) => {
        const s = parseScore(r.score);
        const acc = s.total ? Math.round((s.correct/s.total)*100) : 0;
        // 전역 인덱스 계산(선택 삭제 위해)
        const globalIndex = start + idx;
        return `
          <tr data-gi="${globalIndex}">
            <td><input type="checkbox" class="cb-row"></td>
            <td>${r.date || '-'}</td>
            <td>${r.grade || '-'}</td>
            <td>${r.subject || '-'}</td>
            <td>${r.score || '-'}</td>
            <td>${s.correct}/${s.total}</td>
            <td>${acc}%</td>
          </tr>
        `;
      }).join('');
    }

    pInfo.textContent = `${page} / ${totalPages}`;
    pPrev.disabled = (page<=1);
    pNext.disabled = (page>=totalPages);
    cbAll.checked = false;
  }

  function selectedGlobalIndexes(){
    return $$('.cb-row', body).reduce((arr, cb, i) => {
      if (cb.checked) {
        const tr = cb.closest('tr');
        const gi = Number(tr?.getAttribute('data-gi'));
        if (!Number.isNaN(gi)) arr.push(gi);
      }
      return arr;
    }, []);
  }

  function deleteRows(globalIndexes){
    if (!globalIndexes.length) return;
    // globalIndexes는 현재 dataView 기준이므로, dataAll에서 해당 레코드를 찾아 제거해야 한다.
    // 기준: date+grade+subject+score 조합(충분히 유니크)
    const keysToDelete = new Set(globalIndexes.map(i => {
      const r = dataView[i];
      return r ? `${r.date}|${r.grade}|${r.subject}|${r.score}` : '';
    }));

    // dataAll에서 제거
    dataAll = dataAll.filter(r => !keysToDelete.has(`${r.date}|${r.grade}|${r.subject}|${r.score}`));
    // 저장
    const currentUser = localStorage.getItem('currentUser');
    const sd = getLSJSON('studyData', {});
    if (currentUser){
      if (!sd[currentUser]) sd[currentUser] = { incorrect: [], records: [] };
      sd[currentUser].records = dataAll;
      setLSJSON('studyData', sd);
      // 서버 동기화(실패 무시)
      fetch(`/api/data/${currentUser}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(sd) })
        .catch(()=>{});
    }
  }

  function exportCSV(rows){
    // BOM 포함(엑셀에서 한글 깨짐 방지)
    const bom = '\uFEFF';
    const head = ['날짜','학년','과목','점수','정답수','총문항','정답률(%)'];
    const lines = [head.join(',')];
    rows.forEach(r=>{
      const s = parseScore(r.score);
      const acc = s.total ? Math.round((s.correct/s.total)*100) : 0;
      lines.push([r.date||'', r.grade||'', r.subject||'', r.score||'', s.correct, s.total, acc].join(','));
    });
    const blob = new Blob([bom + lines.join('\n')], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `soi-study-records_${ymd(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // 이벤트
  document.addEventListener('DOMContentLoaded', () => {
    // 초기 로드
    loadData();
    applyFilters();

    // 필터 변경
    [fStart, fEnd, fGrade, fSubject].forEach(el => el.addEventListener('change', applyFilters));

    // 정답률 정렬 토글
    $('btn-sort-acc').addEventListener('click', () => {
      sortAccDesc = !sortAccDesc;
      sortByAcc();
      render();
    });

    // 페이지
    pPrev.addEventListener('click', () => { if (page>1){ page--; render(); }});
    pNext.addEventListener('click', () => { page++; render(); });
    pSize.addEventListener('change', () => { pageSize = parseInt(pSize.value||'20',10); page=1; render(); });

    // 전체선택
    cbAll.addEventListener('change', () => {
      $$('.cb-row', body).forEach(cb => cb.checked = cbAll.checked);
    });

    // 선택 삭제
    $('btn-del-selected').addEventListener('click', () => {
      const idxs = selectedGlobalIndexes();
      if (!idxs.length) { alert('선택된 행이 없습니다.'); return; }
      if (!confirm('선택한 기록을 삭제할까요?')) return;
      deleteRows(idxs);
      applyFilters();
    });

    // 전체 삭제
    $('btn-del-all').addEventListener('click', () => {
      if (!dataAll.length) { alert('삭제할 기록이 없습니다.'); return; }
      if (!confirm('모든 학습 기록을 삭제할까요?')) return;
      dataAll = [];
      // 저장
      const currentUser = localStorage.getItem('currentUser');
      const sd = getLSJSON('studyData', {});
      if (currentUser){
        if (!sd[currentUser]) sd[currentUser] = { incorrect: [], records: [] };
        sd[currentUser].records = [];
        setLSJSON('studyData', sd);
        fetch(`/api/data/${currentUser}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(sd) })
          .catch(()=>{});
      }
      applyFilters();
    });

    // CSV
    $('btn-export').addEventListener('click', () => {
      exportCSV(dataView);
    });
  });

})();
