<script>
// js/api-shim.js — 프론트 API 일원화 (시트/데이터)
(function () {
  const CFG = window.CONFIG || {};
  const TSV = CFG.GOOGLE_SHEET_TSV || "";           // 직결 시트 URL (있으면 최우선)
  const E   = CFG.ENDPOINTS || {};
  const TMO = CFG.API_TIMEOUT_MS || 8000;
  const RET = CFG.API_RETRIES || 1;

  function timeoutFetch(url, opt={}, ms=TMO){
    return new Promise((resolve, reject)=>{
      const ac = new AbortController();
      const id = setTimeout(()=>ac.abort(), ms);
      fetch(url, { ...opt, signal: ac.signal })
        .then(r=>{ clearTimeout(id); resolve(r); })
        .catch(e=>{ clearTimeout(id); reject(e); });
    });
  }

  async function retry(fn, times=RET){
    let last;
    for(let i=0;i<=times;i++){
      try { return await fn(); } catch(e){ last=e; }
    }
    throw last;
  }

  // ===== Problems (TSV) =====
  async function problems(){
    return retry(async ()=>{
      const url = TSV || (E.PROBLEMS || "/api/problems");
      const r = await timeoutFetch(url, { headers: { "Cache-Control":"no-cache" }});
      if (!r.ok) throw new Error("problems fetch failed: "+r.status);
      return r.text();
    });
  }

  // ===== StudyData GET/POST =====
  async function dataGet(user){
    const url = (E.DATA_GET && E.DATA_GET(user)) || `/api/data/${encodeURIComponent(user)}`;
    const r = await timeoutFetch(url, { headers:{ "Accept":"application/json" }});
    if (!r.ok) throw new Error("data get failed: "+r.status);
    return r.json();
  }

  async function dataPost(user, payload){
    const url = (E.DATA_POST && E.DATA_POST(user)) || `/api/data/${encodeURIComponent(user)}`;
    const r = await timeoutFetch(url, {
      method:"POST",
      headers:{ "Content-Type":"application/json", "Accept":"application/json" },
      body: JSON.stringify(payload || {})
    });
    if (!r.ok) throw new Error("data post failed: "+r.status);
    return r.json();
  }

  window.API = { problems, dataGet, dataPost };
})();
</script>
