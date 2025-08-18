// /js/sheets.js
window.SoiSheets = {
  async load({ grade, subject = "", difficulty = "" }) {
    const url = window.SOI_CONFIG.sheetUrl;
    const res = await fetch(url, { headers: { Accept: "*/*" } });
    const text = await res.text();
    let rows = [];
    try { const json = JSON.parse(text); rows = Array.isArray(json) ? json : (json.items || []); }
    catch { const delim = (text.match(/\t/g)||[]).length > (text.match(/,/g)||[]).length ? "\t" : ","; rows = parseDelimited(text, delim); }
    const items = rows.map(mapRow);
    const filtered = items.filter(it => (!grade || it.grade===grade) && (!subject || it.subject===subject) && (!difficulty || it.difficulty===difficulty));
    shuffle(filtered);
    return filtered;
  },
};
function parseDelimited(text, delim) {
  const lines = text.replace(/\r/g,"").split("\n").filter(x=>x.trim()); if(!lines.length) return [];
  const head = lines[0].split(delim).map(s=>s.trim()); const out=[];
  for(let i=1;i<lines.length;i++){const cols=lines[i].split(delim); const row={}; for(let j=0;j<head.length;j++) row[head[j]]=(cols[j]||"").trim(); out.push(row);}
  return out;
}
function mapRow(r) {
  const grade=r["학년"]||"", subject=r["과목"]||"", difficulty=r["난이도"]||r["레벨"]||"";
  const question=r["문제"]||r["질문"]||"";
  const choices=[r["보기1"],r["보기2"],r["보기3"],r["보기4"]].filter(Boolean);
  let answer=r["정답"]; if(/^\d+$/.test(String(answer))&&choices.length){const idx=Math.max(1,Math.min(choices.length,parseInt(answer,10)))-1; answer=choices[idx];}
  const image=r["이미지"]||""; return { grade, subject, difficulty, question, choices, answer, image };
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}}
