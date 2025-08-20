// server.js - Render 환경에서 동작하는 안전한 최소+API 버전

const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// ====== Env ======
const PORT = Number(process.env.PORT) || 10000;
const MONGODB_URI = process.env.MONGODB_URI || ''; // Render 대시보드와 이름 통일
const GOOGLE_SHEET_TSV = process.env.GOOGLE_SHEET_TSV || ''; // 시트 직결용(옵션)

// ====== Middleware ======
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ====== Static (보안상 public 폴더로 제한 권장) ======
const PUBLIC_DIR = path.join(__dirname); // 필요시 'public'로 바꾸고 정적파일 이동
app.use(express.static(PUBLIC_DIR));

// ====== Health ======
let dbStatus = 'disconnected';
app.get('/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development', db: dbStatus });
});

// ====== Mongo ======
const pingSchema = new mongoose.Schema({ at: { type: Date, default: Date.now } });
const userDataSchema = new mongoose.Schema(
  {
    user: { type: String, index: true, unique: true },
    data: {
      incorrect: { type: Array, default: [] },
      records: { type: Array, default: [] },
    },
  },
  { timestamps: true }
);

const Ping = mongoose.model('Ping', pingSchema);
const UserData = mongoose.model('UserData', userDataSchema);

async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI 없음. DB 없이 실행합니다.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    dbStatus = 'connected';
    console.log('✅ MongoDB 연결 성공');
    await Ping.create({});
    console.log('✅ 쓰기 테스트 성공(pings)');
  } catch (err) {
    dbStatus = 'error';
    console.error('❌ MongoDB 연결 실패:', err.message);
  }
}

// ====== API: Problems ======
// 우선순위: GOOGLE_SHEET_TSV → 로컬 models/problems.tsv
app.get('/api/problems', async (req, res) => {
  try {
    if (GOOGLE_SHEET_TSV) {
      const r = await fetch(GOOGLE_SHEET_TSV, { method: 'GET' });
      if (!r.ok) throw new Error(`Sheet HTTP ${r.status}`);
      const text = await r.text();
      if (!text || !text.split(/\r?\n/)[0]) throw new Error('Empty TSV');
      res.type('text/plain').send(text);
      return;
    }
    const localPath = path.join(__dirname, 'models', 'problems.tsv');
    if (fs.existsSync(localPath)) {
      const text = fs.readFileSync(localPath, 'utf8');
      res.type('text/plain').send(text);
      return;
    }
    res.status(404).json({ ok: false, error: 'No sheet and no local TSV found' });
  } catch (e) {
    console.error('[GET /api/problems] error:', e.message || e);
    res.status(500).json({ ok: false, error: e.message || 'problems fetch failed' });
  }
});

// ====== API: UserData ======
app.get('/api/data/:user', async (req, res) => {
  try {
    const user = String(req.params.user || '').trim();
    if (!user) return res.status(400).json({ ok: false, error: 'user required' });

    if (!MONGODB_URI) return res.json({ incorrect: [], records: [] });

    const doc = await UserData.findOne({ user }).lean();
    if (!doc) return res.json({ incorrect: [], records: [] });
    res.json(doc.data || { incorrect: [], records: [] });
  } catch (e) {
    console.error('[GET /api/data/:user] error:', e.message || e);
    res.status(500).json({ ok: false, error: e.message || 'load failed' });
  }
});

app.post('/api/data/:user', async (req, res) => {
  try {
    const user = String(req.params.user || '').trim();
    if (!user) return res.status(400).json({ ok: false, error: 'user required' });

    const body = req.body || {};
    const payload =
      body[user] && typeof body[user] === 'object'
        ? body[user]
        : (typeof body === 'object' ? body : null);

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ ok: false, error: 'invalid payload' });
    }

    if (!MONGODB_URI) return res.json({ ok: true, mode: 'local-only' });

    const data = {
      incorrect: Array.isArray(payload.incorrect) ? payload.incorrect : [],
      records: Array.isArray(payload.records) ? payload.records : [],
    };

    await UserData.updateOne({ user }, { $set: { data } }, { upsert: true });
    res.json({ ok: true });
  } catch (e) {
    console.error('[POST /api/data/:user] error:', e.message || e);
    res.status(500).json({ ok: false, error: e.message || 'save failed' });
  }
});

// ====== Start & DB Connect ======
app.listen(PORT, () => {
  console.log(`soi-homestudy running on port ${PORT}`);
  connectDB();
});

// ====== Graceful shutdown ======
process.on('SIGTERM', async () => {
  try {
    console.log('SIGTERM received, closing Mongo connection...');
    await mongoose.connection.close();
  } catch {}
  process.exit(0);
});
