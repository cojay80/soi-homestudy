// server.js (Express 정적 서버; HTML 넣지 마세요)
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 레포 루트 정적 서빙: /, /pages, /js, /css, /images ...
app.use(express.static(path.join(__dirname)));

// 홈
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 헬스체크(선택)
app.get('/healthz', (_req, res) => res.send('ok'));

// 멀티페이지 구조라 SPA catch-all 불필요
// app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => {
  console.log(`soi-homestudy running on port ${PORT}`);
});
