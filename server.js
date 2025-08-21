// server.js — Render/로컬 공용, 결과 저장 API 포함 완성본

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

const app = express();

// ===== 환경설정 =====
const PORT = Number(process.env.PORT) || 10000;
const MONGODB_URI = process.env.MONGODB_URI || ''; // Render 대시보드에 설정
const GOOGLE_SHEET_TSV = process.env.GOOGLE_SHEET_TSV || ''; // (선택) 프록시용

// ===== 미들웨어 =====
app.use(morgan('tiny'));
app.use(express.json({ limit: '2mb' }));            // JSON 파서
app.use(express.urlencoded({ extended: true }));    // 폼 파서

// 정적 파일: 레포 루트(index.html 등)
app.use(express.static(path.join(__dirname)));

// ===== DB 연결 =====
async function connectDB() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI 환경변수가 없습니다.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ MongoDB 연결 성공');
  } catch (err) {
    console.error('❌ MongoDB 연결 실패:', err.message);
  }
}
connectDB();

// ===== 스키마/모델 =====
// studyData 전부를 data 필드로 저장(유연)
const StudyDataSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true, unique: true },
    data:   { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);
const StudyData = mongoose.model('StudyData', StudyDataSchema);

// ===== 헬스체크 =====
app.get('/health', async (req, res) => {
  let db = 'disconnected';
  try {
    await mongoose.connection.db.admin().ping();
    db = 'connected';
  } catch (_) {}
  res.json({ ok: true, env: process.env.NODE_ENV || 'development', db });
});

// ===== (선택) 시트 프록시 =====
// 프론트가 시트를 직접 가져오지 못하는 환경일 때 사용.
// config.js 의 GOOGLE_SHEET_TSV 를 비워두고 이 엔드포인트를 사용하게 할 수 있음.
app.get('/api/problems', async (req, res) => {
  try {
    if (!GOOGLE_SHEET_TSV) return res.status(501).json({ error: 'GOOGLE_SHEET_TSV not set' });
    const fetch = (await import('node-fetch')).default;
    const r = await fetch(GOOGLE_SHEET_TSV, { timeout: 8000 });
    if (!r.ok) return res.status(502).json({ error: 'Sheet fetch failed', status: r.status });
    const text = await r.text();
    res.type('text/tab-separated-values').send(text);
  } catch (e) {
    console.error('Sheet proxy error:', e.message);
    res.status(500).json({ error: 'sheet_proxy_failed' });
  }
});

// ===== 저장/조회 API =====

// GET /api/data/:user  -> 유저 데이터 조회(없으면 빈 객체)
app.get('/api/data/:user', async (req, res) => {
  try {
    const userId = decodeURIComponent(req.params.user);
    const doc = await StudyData.findOne({ userId }).lean();
    res.json(doc?.data || {});
  } catch (e) {
    console.error('GET data error:', e);
    res.status(500).json({ error: 'get_failed' });
  }
});

// POST /api/data/:user -> 유저 데이터 저장(업서트)
// 프론트에서 studyData 전체를 보내는 경우가 있어 user 스코프로 잘라 저장 처리 추가.
app.post('/api/data/:user', async (req, res) => {
  try {
    const userId = decodeURIComponent(req.params.user);

    // 프론트에서 온 body가 전체 studyData면 해당 유저 부분만 꺼내기
    let payload = req.body;
    if (payload && typeof payload === 'object' && payload[userId]) {
      payload = payload[userId];
    }

    const doc = await StudyData.findOneAndUpdate(
      { userId },
      { $set: { data: payload || {} } },
      { new: true, upsert: true }
    ).lean();

    res.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error('POST data error:', e);
    res.status(500).json({ error: 'post_failed' });
  }
});

// ===== 서버 시작 =====
app.listen(PORT, () => {
  console.log(`soi-homestudy listening on :${PORT}`);
});
