// server.cjs — Render 배포용 확정본 (CommonJS)
// - 정적파일 정확히 서빙 → "<" 에러 차단
// - /api/problems: 구글시트 TSV 프록시
// - /api/data/:user: 학습데이터 저장/조회 (MongoDB)
// - index.html은 no-store로 내려 캐시 꼬임 방지

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

const app = express();
const PORT = Number(process.env.PORT) || 10000;

// ===== 환경변수 =====
const GOOGLE_SHEET_TSV =
  process.env.GOOGLE_SHEET_TSV ||
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://soiuser:162wn4331@cluster0.dmtk0ea.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// ===== 미들웨어 =====
app.use(morgan('tiny'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ===== 정적 파일 서빙 (핵심) =====
// 루트 + 디렉터리별 명시적 매핑으로 JS 404→HTML 응답 방지
app.use(express.static(path.join(__dirname)));
app.use('/js',     express.static(path.join(__dirname, 'js')));
app.use('/css',    express.static(path.join(__dirname, 'css')));
app.use('/img',    express.static(path.join(__dirname, 'img')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// 헬스체크
app.get('/health', (_req, res) => res.json({ ok: true }));

// ===== Google Sheet TSV 프록시 (/api/problems) =====
// Node 18+ 전역 fetch 사용
app.get('/api/problems', async (_req, res) => {
  try {
    const r = await fetch(GOOGLE_SHEET_TSV, { cache: 'no-store' });
    if (!r.ok) return res.status(502).send('Bad gateway: sheet');
    const tsv = await r.text();
    res.type('text/tab-separated-values').send(tsv);
  } catch (e) {
    console.error('[sheet] error:', e.message);
    res.status(500).send('Sheet fetch error');
  }
});

// ===== Mongo 연결 및 모델 =====
let UserData;
async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('[mongo] MONGODB_URI not set (no-db mode)');
    return;
  }
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const schema = new mongoose.Schema(
    {
      user: { type: String, index: true },
      blob: { type: Object, default: {} },
      updatedAt: { type: Date, default: Date.now },
    },
    { collection: 'user_data' }
  );
  UserData = mongoose.models.UserData || mongoose.model('UserData', schema);
  console.log('✅ Mongo connected');
}
connectDB().catch(err => console.error('❌ Mongo error:', err.message));

// 조회
app.get('/api/data/:user', async (req, res) => {
  try {
    const user = String(req.params.user || '');
    if (!UserData || !user) return res.json({});
    const doc = await UserData.findOne({ user }).lean();
    res.json(doc?.blob || {});
  } catch (e) {
    console.error('[data:get]', e.message);
    res.json({});
  }
});

// 저장(전체 덮어쓰기)
app.post('/api/data/:user', async (req, res) => {
  try {
    const user = String(req.params.user || '');
    if (!UserData || !user) return res.status(200).json({ ok: true, memo: 'no-db-mode' });
    await UserData.findOneAndUpdate(
      { user },
      { $set: { blob: req.body || {}, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('[data:post]', e.message);
    res.status(500).json({ ok: false });
  }
});

// ===== SPA 라우팅(맨 마지막) =====
// index.html만 no-store — 오래된 index가 JS요청에 섞이는 캐시 꼬임 방지
app.get('*', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== 서버 시작 =====
app.listen(PORT, () => console.log(`soi-homestudy on :${PORT}`));
