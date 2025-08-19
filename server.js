// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 레포 루트 정적 서빙
app.use(express.static(path.join(__dirname)));

// 홈
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
// .ico로 요청이 오면 .svg로 영구 리다이렉트
app.get('/favicon.ico', (_req, res) => res.redirect(301, '/favicon.svg'));

// 헬스체크(Health Check Path에 쓸 엔드포인트)
app.get('/healthz', (_req, res) => res.send('ok'));

app.listen(PORT, () => {
  console.log(`soi-homestudy running on port ${PORT}`);
});
