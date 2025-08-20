// server.js - Render 환경에서 동작하는 안전한 최소 버전

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Render가 지정한 포트 우선 사용 (없으면 10000)
const PORT = Number(process.env.PORT) || 10000;
// Render 대시보드에 넣을 MongoDB 접속 문자열
const MONGODB_URI = process.env.MONGODB_URI || '';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙: 레포 루트(index.html 등)
app.use(express.static(path.join(__dirname)));

// 헬스체크 (배포 확인용)
app.get('/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development' });
});

// DB 연결 테스트용 간단 모델
const pingSchema = new mongoose.Schema({
  at: { type: Date, default: Date.now },
});
const Ping = mongoose.model('Ping', pingSchema);

async function connectDB() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI 환경변수가 없습니다. Render 대시보드 > Environment에서 설정하세요.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10초 안에 접속 안 되면 실패
    });
    console.log('✅ MongoDB 연결 성공');
    // 아주 간단한 쓰기 테스트
    await Ping.create({});
    console.log('✅ 간단한 쓰기 테스트 성공 (pings 컬렉션에 문서 1개 추가)');
  } catch (err) {
    console.error('❌ MongoDB 연결 실패:', err.message);
  }
}

// 서버 시작 후 DB 연결 시도
app.listen(PORT, () => {
  console.log(`soi-homestudy running on port ${PORT}`);
  connectDB();
});
