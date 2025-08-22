// js/sheets.js — 모바일 안정화 버전 (프록시 실패 시 즉시 TSV/CSV 폴백 + 세션 캐시)
// 사용법: await window.SoiSheets.load({ grade:'', subject:'' })

(function () {
  const PROXY_URL = "/api/problems";
  const TSV_URL   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv";
  const CACHE_KEY = "SOI_TSV_CACHE_V2"; // V2: 파서 고도화

  const WANTED = ['학년','과목','질문','보기1','보기2','보기3','보기4','정답','이미지','지문 ID','지문'];
  const ALIAS  = {
    'grade':'학년','subject':'과목','question':'질문','answer':'정답','image':'이미지',
    'option1':'보기1','option2':'보기2','option3':'보기3','option4':'보기4',
    '지문id':'지문 ID','지문ID':'지문 ID','passage id':'지문 ID','passage':'지문'
  };
  const norm = (s)=> String(s||'').toLowerCase().replace(/\s+/g,' ').trim();

  function pickDelim(headerLine) {
    // 탭이 더 많으면 TSV, 아니면 CSV
    const t = (headerLine.match(/\t/g)||[]).length;
    const c = (headerLine.match(/,/g)||[]).length;
    return t >= c ? '\t' : ',';
  }

  function splitSmart(line, delim) {
    // CSV/TSV 공용: 따옴표 안의 구분자는 무시, "" -> "
    const out = [];
    let buf = '', inQ = false;
    for (let i=0; i<line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i+1] === '"') { buf += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === delim && !inQ) {
        out.push(buf); buf = '';
      } else {
        buf += ch;
      }
    }
    out.push(buf);
    return out;
  }

  function buildHeaderMap(rawHeaders) {
    const map = {};
    rawHeaders.forEach((h, i) => {
      const hN = norm(h);
      let key = WANTED.find(w => norm(w) === hN);
      if (!key) {
        const ali = Object.entries(ALIAS).find(([from]) => norm(from) === hN);
        if (ali) key = ali[1];
      }
      map[i] = key || h; // 못 찾으면 원문 유지
    });
    return map;
  }

  function parseTable(text) {
    if (!text || !text.trim()) return [];
    const t = text.replace(/^\uFEFF/,''); // BOM 제거
    // HTML(프록시 404/500/SPA) 오염 즉시 차단
    if (t.trim().startsWith('<')) throw new Error('Expected TSV/CSV but got HTML');

    const lines = t.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(l => l.trim().length);
    if (lines.length < 2) return [];

    const delim = pickDelim(lines[0]);
    const headers = splitSmart(lines[0], delim);
    const hmap = buildHeaderMap(headers);

    const data = [];
    for (let i=1; i<lines.length; i++) {
      const cols = splitSmart(lines[i], delim);
      const row = {};
      cols.forEach((v, idx) => { const k = hmap[idx]; if (k) row[k] = (v||'').trim(); });

      // 필수 키 매핑(영문 → 한글)
      row['학년']   = row['학년']   || row['grade']   || '';
      row['과목']   = row['과목']   || row['subject'] || '';
      row['질문']   = row['질문']   || row['question']|| '';
      row['정답']   = row['정답']   || row['answer']  || '';
      row['보기1']  = row['보기1']  || row['option1'] || '';
      row['보기2']  = row['보기2']  || row['option2'] || '';
      row['보기3']  = row['보기3']  || row['option3'] || '';
      row['보기4']  = row['보기4']  || row['option4'] || '';
      row['이미지'] = row['이미지'] || row['image']   || '';
      row['지문 ID']= row['지문 ID']|| row['지문id']   || row['지문ID'] || row['passage id'] || '';
      row['지문']   = row['지문']   || row['passage']  || '';

      // 최소 필드 검증
      if (!row['학년'] || !row['과목'] || !row['질문'] || !row['정답']) continue;

      // 편의용 영문 키 병행
      row.grade   = row['학년'];
      row.subject = row['과목'];

      data.push(row);
    }
    return data;
  }

  async function fetchText(url, timeoutMs = 8000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadProblems() {
    // 1) 세션 캐시 먼저 (정상 파싱한 것만 저장해 두었음)
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}

    // 2) 프록시 → 실패 시 직결
    let text;
    try {
      text = await fetchText(PROXY_URL, 6000);
    } catch {
      text = await fetchText(TSV_URL, 9000);
    }

    let parsed = [];
    try {
      parsed = parseTable(text);
    } catch (e) {
      // 3) 파싱까지 실패 → 이전 세션 캐시라도 있으면 그것으로 폴백
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        try { return JSON.parse(cached); } catch {}
      }
      throw e; // 정말로 대안이 없을 때만 에러 던짐
    }

    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(parsed)); } catch {}
    return parsed;
  }

  async function load({ grade = '', subject = '' } = {}) {
    const all = await loadProblems();
    if (!grade && !subject) return all;
    return all.filter(p =>
      (!grade   || (p.grade   || p['학년'])   === grade) &&
      (!subject || (p.subject || p['과목'])   === subject)
    );
  }

  window.SoiSheets = { load };
})();
