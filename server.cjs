// server.cjs — Render용 CommonJS 서버 (문제 프록시 + 사용자 데이터 저장)
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = Number(process.env.PORT) || 10000;
const MONGODB_URI = process.env.MONGODB_URI || '';
const GOOGLE_SHEET_TSV = process.env.GOOGLE_SHEET_TSV || ''; // 선택

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 정적 파일 (repo 루트: index.html 등)
app.use(express.static(path.join(__dirname)));

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development' });
});

// ---- Mongo 연결 & 모델
const userDataSchema = new mongoose.Schema(
  {
    user: { type: String, index: true, unique: true },
    data: { type: Object, default: {} }, // studyData 전체 저장
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'user_data' }
);
const UserData = mongoose.model('UserData', userDataSchema);

async function connectDB() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI 환경변수가 없습니다. Render > Environment에 추가하세요.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ MongoDB 연결 성공');
  } catch (err) {
    console.error('❌ MongoDB 연결 실패:', err.message);
  }
}

// ---- (선택) 문제 프록시
app.get('/api/problems', async (req, res) => {
  try {
    if (!GOOGLE_SHEET_TSV) {
      // 서버 프록시 미사용: 프런트에서 직접 시트 URL을 쓰는 경우
      res.status(200).type('text/plain').send('');
      return;
    }
    const r = await fetch(GOOGLE_SHEET_TSV, { cache: 'no-store' });
    if (!r.ok) throw new Error('Sheet fetch error: ' + r.status);
    const text = await r.text();
    res.status(200).type('text/plain').send(text);
  } catch (e) {
    console.error('GET /api/problems error:', e.message);
    res.status(500).json({ error: 'PROBLEMS_FETCH_FAILED' });
  }
});

// ---- 사용자 데이터 조회/저장
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
