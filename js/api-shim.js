// /js/api-shim.js
// 백엔드 없이도 기존 "/api/..." 호출이 동작하도록 fetch를 가로채는 셈.
// 필요: config.js( SOI_CONFIG ), core-auth-store.js( SoiStore )

(function () {
  const origFetch = window.fetch.bind(window);

  async function ensureUID() {
    let u = await window.SoiStore.currentUser();
    if (!u) u = await window.SoiStore.signIn("local@demo.com", "local-demo"); // 로컬 폴백
    return u.uid;
  }

  async function handleProblems() {
    const url = (window.SOI_CONFIG && window.SOI_CONFIG.sheetUrl) || "";
    if (!url) {
      const tsv = "학년\t과목\t질문\t보기1\t보기2\t보기3\t보기4\t정답\t이미지\t지문 ID\t지문\n";
      return new Response(tsv, { status: 200, headers: { "Content-Type": "text/tab-separated-values; charset=utf-8" } });
    }
    const r = await origFetch(url, { headers: { Accept: "*/*" } });
    const text = await r.text();
    return new Response(text, { status: 200, headers: { "Content-Type": "text/tab-separated-values; charset=utf-8" } });
  }

  async function handleUserGET(username) {
    const uid = await ensureUID();
    const doc = await window.SoiStore.getUserDoc(uid);
    const body = {
      username: doc.name || username || "",
      incorrect: Array.isArray(doc.incorrect) ? doc.incorrect : [],
      records:   Array.isArray(doc.records)   ? doc.records   : [],
      goals:     Array.isArray(doc.goals)     ? doc.goals     : [],
    };
    return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  async function safeReadJson(input, init) {
    try {
      if (init && init.body && typeof init.body === "string") return JSON.parse(init.body);
      if (typeof Request !== "undefined" && input instanceof Request) return await input.clone().json();
    } catch (_) {}
    return {};
  }

  async function handleUserSave(username, input, init) {
    const uid = await ensureUID();
    const payload = await safeReadJson(input, init);
    const doc = await window.SoiStore.getUserDoc(uid);
    const merged = { ...doc };

    ["incorrect", "records", "goals", "name", "points", "rewards"].forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(payload, k)) merged[k] = payload[k];
    });

    await window.SoiStore.setUserDoc(uid, merged);
    await window.SoiStore.pushLog(uid, { source: "api-shim", action: "save", tier: "none", points: 0, couponName: username || "" });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  async function shimFetch(input, init = {}) {
    try {
      const url = typeof input === "string" ? input : input.url;
      const method = (init.method || (typeof input === "string" ? "GET" : input.method) || "GET").toUpperCase();

      if (url.startsWith("/api/problems")) {
        return await handleProblems();
      }

      if (url.startsWith("/api/data/")) {
        const username = decodeURIComponent(url.split("/").pop() || "");
        if (method === "GET") return await handleUserGET(username);
        if (["POST","PUT","PATCH"].includes(method)) return await handleUserSave(username, input, init);
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
    } catch (e) {
      console.error("[api-shim] error:", e);
    }
    return origFetch(input, init);
  }

  window.fetch = shimFetch;
})();
