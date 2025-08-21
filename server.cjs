// server.js — Render용 최소 백엔드(문제 프록시 + 사용자 데이터 저장)
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const fetch = require('node-fetch');

const app = express();
const PORT = Number(process.env.PORT) || 10000;
const MONGODB_URI = process.env.MONGODB_URI || '';
// 시트 TSV를 서버에서 프록시하고 싶을 때(선택) — 없으면 프런트가 직접 읽음
const GOOGLE_SHEET_TSV = process.env.GOOGLE_SHEET_TSV || '';

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 정적 파일 (repo 루트)
app.use(express.static(path.join(__dirname)));

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development' });
});

// ---- Mongo 연결 & 모델
const userDataSchema = new mongoose.Schema(
  {
    user: { type: String, index: true, unique: true },
    // studyData 전체를 그대로 저장(프런트 구조 유지)
    data: { type: Object, default: {} },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'user_data' }
);
const UserData = mongoose.model('UserData', userDataSchema);

async function connectDB() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI 환경변수가 없습니다. Render 대시보드 > Environment에서 설정하세요.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ MongoDB 연결 성공');
  } catch (err) {
    console.error('❌ MongoDB 연결 실패:', err.message);
  }
}

// ---- API: 문제 프록시 (선택)
// 프런트가 config.js의 GOOGLE_SHEET_TSV로 직접 불러오지만,
// 보안/속도 때문에 서버로 우회하고 싶을 때 사용.
app.get('/api/problems', async (req, res) => {
  try {
    const url = GOOGLE_SHEET_TSV || '';
    if (!url) {
      res.status(200).type('text/plain').send(''); // 서버 프록시 미사용
      return;
    }
    const r = await fetch(url, { timeout: 10000 });
    if (!r.ok) throw new Error('Sheet fetch error: ' + r.status);
    const text = await r.text();
    res.status(200).type('text/plain').send(text);
  } catch (e) {
    console.error('GET /api/problems error:', e.message);
    res.status(500).json({ error: 'PROBLEMS_FETCH_FAILED' });
  }
});

// ---- API: 사용자 데이터 저장/조회 ----

// 조회
app.get('/api/data/:user', async (req, res) => {
  try {
    const user = String(req.params.user || '').trim();
    if (!user) return res.status(400).json({ error: 'NO_USER' });
    const doc = await UserData.findOne({ user });
    res.json(doc?.data || {});
  } catch (e) {
    console.error('GET /api/data error:', e.message);
    res.status(500).json({ error: 'DATA_GET_FAILED' });
  }
});

// 저장(덮어쓰기)
app.post('/api/data/:user', async (req, res) => {
  try {
    const user = String(req.params.user || '').trim();
    if (!user) return res.status(400).json({ error: 'NO_USER' });
    const data = req.body || {};
    const doc = await UserData.findOneAndUpdate(
      { user },
      { $set: { data, updatedAt: new Date() } },
      { upsert: true, new: true }
    );
    res.json({ ok: true, savedAt: doc.updatedAt });
  } catch (e) {
    console.error('POST /api/data error:', e.message);
    res.status(500).json({ error: 'DATA_SAVE_FAILED' });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`soi-homestudy running on port ${PORT}`);
  connectDB();
});
