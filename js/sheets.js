// js/sheets.js
// Google Sheet TSV를 읽어 문제 배열로 변환.
// 헤더 한글/영문 혼용 대응.

(function (global) {
  async function fetchTSV(url) {
    const r = await fetch(url, { headers: { "Accept": "*/*" } });
    const text = await r.text();
    return text;
  }

  function parseTSV(text) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    // 헤더는 다음 컬럼들을 기대 (한국어 기준)
    // 학년 | 과목 | 질문 | 보기1 | 보기2 | 보기3 | 보기4 | 정답 | 이미지 | 지문 ID | 지문
    const header = lines[0].split('\t');
    const idx = (name) => header.indexOf(name);

    const mapIdx = {
      grade:   idx('학년') !== -1 ? idx('학년') : idx('grade'),
      subject: idx('과목') !== -1 ? idx('과목') : idx('subject'),
      question:idx('질문') !== -1 ? idx('질문') : idx('question'),
      c1:      idx('보기1') !== -1 ? idx('보기1') : idx('choice1'),
      c2:      idx('보기2') !== -1 ? idx('보기2') : idx('choice2'),
      c3:      idx('보기3') !== -1 ? idx('보기3') : idx('choice3'),
      c4:      idx('보기4') !== -1 ? idx('보기4') : idx('choice4'),
      answer:  idx('정답') !== -1 ? idx('정답') : idx('answer'),
      image:   idx('이미지') !== -1 ? idx('이미지') : idx('image'),
      pid:     idx('지문 ID') !== -1 ? idx('지문 ID') : idx('passage id'),
      passage: idx('지문') !== -1 ? idx('지문') : idx('passage')
    };

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split('\t');
      if (!cols.length) continue;
      rows.push({
        grade:   cols[mapIdx.grade]   ?? "",
        학년:     cols[mapIdx.grade]   ?? "",
        subject: cols[mapIdx.subject] ?? "",
        과목:     cols[mapIdx.subject] ?? "",
        question:cols[mapIdx.question]?? "",
        질문:     cols[mapIdx.question]?? "",
        choices: [
          cols[mapIdx.c1] ?? "",
          cols[mapIdx.c2] ?? "",
          cols[mapIdx.c3] ?? "",
          cols[mapIdx.c4] ?? ""
        ],
        정답:  cols[mapIdx.answer] ?? "",
        answer:cols[mapIdx.answer] ?? "",
        image: cols[mapIdx.image]  ?? "",
        passageId: cols[mapIdx.pid] ?? "",
        지문ID: cols[mapIdx.pid] ?? "",
        passage: cols[mapIdx.passage] ?? "",
        지문: cols[mapIdx.passage] ?? ""
      });
    }
    return rows;
  }

  async function load({ grade = "", subject = "" } = {}) {
    const url = (window.SOI_CONFIG && window.SOI_CONFIG.sheetUrl) || "";
    if (!url) return [];
    const tsv = await fetchTSV(url);
    let all = parseTSV(tsv);
    if (grade)   all = all.filter(p => (p.grade || p.학년) === grade);
    if (subject) all = all.filter(p => (p.subject || p.과목) === subject);
    return all;
  }

  global.SoiSheets = { load };
})(window);
