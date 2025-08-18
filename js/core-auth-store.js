// /js/core-auth-store.js
(function (global) {
  const cfg = window.SOI_CONFIG || {};
  const hasFirebase = cfg.firebase && cfg.firebase.apiKey && cfg.firebase.projectId && cfg.firebase.appId;
  async function ensureFirebase() {
    if (!hasFirebase) return null;
    if (global.firebase) return global.firebase;
    await load("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
    await load("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js");
    await load("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js");
    global.firebase.initializeApp(cfg.firebase);
    return global.firebase;
  }
  function load(src){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=()=>res();s.onerror=rej;document.head.appendChild(s);});}
  const LSKEY="soiStoreV1";
  function lsRead(){try{return JSON.parse(localStorage.getItem(LSKEY)||"{}");}catch{return{};}}
  function lsWrite(o){localStorage.setItem(LSKEY,JSON.stringify(o||{}));}
  function lsUserDoc(uid){const all=lsRead();return all[uid]||(all[uid]={points:0,rewards:{},missStreak:0,logs:[]});}
  const api={
    async signIn(email,pwd){if(!hasFirebase){const uid="local-user";localStorage.setItem("soiUID",uid);return{uid};}const fb=await ensureFirebase();const {user}=await fb.auth().signInWithEmailAndPassword(email,pwd);localStorage.setItem("soiUID",user.uid);return user;},
    async signOut(){const uid=localStorage.getItem("soiUID");if(hasFirebase){const fb=await ensureFirebase();await fb.auth().signOut();}localStorage.removeItem("soiUID");return uid;},
    async currentUser(){const uid=localStorage.getItem("soiUID");if(hasFirebase){const fb=await ensureFirebase();const u=fb.auth().currentUser;return u||(uid?{uid}:null);}return uid?{uid}:null;},
    async getUserDoc(uid){if(!hasFirebase)return lsUserDoc(uid);const fb=await ensureFirebase();const ref=fb.firestore().collection("users").doc(uid);const snap=await ref.get();if(!snap.exists){const init={points:0,rewards:{},missStreak:0,logs:[]};await ref.set(init);return init;}return snap.data();},
    async setUserDoc(uid,partial){if(!hasFirebase){const all=lsRead();const u=lsUserDoc(uid);const next={...u,...partial};all[uid]=next;lsWrite(all);return next;}const fb=await ensureFirebase();const ref=fb.firestore().collection("users").doc(uid);await ref.set(partial,{merge:true});const snap=await ref.get();return snap.data();},
    async pushLog(uid,entry){if(!hasFirebase){const all=lsRead();const u=lsUserDoc(uid);u.logs.push({...entry,time:new Date().toLocaleString()});lsWrite(all);return u.logs.slice(-1)[0];}const fb=await ensureFirebase();const ref=fb.firestore().collection("users").doc(uid).collection("logs");return (await ref.add({...entry,time:new Date().toISOString()})).id;},
    async readLogs(uid,limit=500){if(!hasFirebase){const u=lsUserDoc(uid);return u.logs||[];}const fb=await ensureFirebase();const snap=await fb.firestore().collection("users").doc(uid).collection("logs").orderBy("time","desc").limit(limit).get();return snap.docs.map(d=>d.data());},
  };
  global.SoiStore=api;
})(window);
