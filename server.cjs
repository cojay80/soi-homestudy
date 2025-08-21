// server.cjs — Render 배포용 확정본
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const fetch = require('node-fetch');

const app = express();
const PORT = Number(process.env.PORT) || 10000;

// ===== 환경변수 =====
// Render 대시보드 > Environment에 넣어두면 서버 재시작 없이 사용
const GOOGLE_SHEET_TSV =
  process.env.GOOGLE_SHEET_TSV ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://soiuser:162wn4331@cluster0.dmtk0ea.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// ===== 본문 파서 =====
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ===== 정적 파일 서빙 (핵심) =====
// 루트 + /js /css /images 확실히 매핑해서 JS 404 시 HTML이 내려오는 문제 차단
app.use(express.static(path.join(__dirname)));
app.use('/js',     express.static(path.join(__dirname, 'js')));
app.use('/css',    express.static(path.join(__dirname, 'css')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/sound',  express.static(path.join(__dirname, 'sound')));

// 헬스체크
app.get('/health', (req, res) => res.json({ ok: true }));

// ===== Google Sheet 프록시 (프론트에서는 /api/problems 만 호출) =====
app.get('/api/problems', async (req, res) => {
  try {
    const r = await fetch(GOOGLE_SHEET_TSV, { timeout: 10000 });
    if (!r.ok) return res.status(502).send('Bad gateway: sheet');
    const tsv = await r.text();
    res.type('text/tab-separated-values').send(tsv);
  } catch (e) {
    console.error('[sheet] error', e.message);
    res.status(500).send('Sheet fetch error');
  }
});

// ===== Mongo 연결 & 사용자 학습데이터 저장 =====
let UserData;
async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('[mongo] no MONGODB_URI');
    return;
  }
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const schema = new mongoose.Schema({
    user: { type: String, index: true },
    blob: { type: Object, default: {} },
    updatedAt: { type: Date, default: Date.now }
  });
  UserData = mongoose.models.UserData || mongoose.model('UserData', schema);
  console.log('✅ Mongo connected');
}
connectDB().catch(err => console.error('❌ Mongo error:', err.message));

// GET: 사용자 데이터
app.get('/api/data/:user', async (req, res) => {
  try {
    if (!UserData) return res.json({});
    const doc = await UserData.findOne({ user: req.params.user }).lean();
    res.json(doc?.blob || {});
  } catch (e) {
    console.error('[data:get]', e.message);
    res.json({});
  }
});

// POST: 사용자 데이터 저장(전체 덮어쓰기)
app.post('/api/data/:user', async (req, res) => {
  try {
    const user = req.params.user;
    const blob = req.body || {};
    if (!UserData) return res.status(200).json({ ok: true, memo: 'no-db-mode' });

    await UserData.findOneAndUpdate(
      { user },
      { $set: { blob, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('[data:post]', e.message);
    res.status(500).json({ ok: false });
  }
});

// ===== SPA 기본 라우팅(정적 파일과 충돌 없게 *마지막*에 배치) =====
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== 서버 시작 =====
app.listen(PORT, () => console.log(`soi-homestudy on :${PORT}`));
