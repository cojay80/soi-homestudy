// server.js (완성본, CommonJS)
// Render/Heroku 스타일 포트 바인딩 + 헬스체크 + 안전한 정적 서빙

'use strict';

const express = require('express');
const path = require('path');
const compression = require('compression');
const morgan = require('morgan');

const app = express();

// Render 프록시 뒤라면 신뢰(실제 클라이언트 IP 파악)
app.set('trust proxy', 1);

// 압축 & 간단 로깅
app.use(compression());
app.use(morgan('tiny'));

// 헬스체크 (Render Health Check에서 /healthz 설정)
app.get('/healthz', (_req, res) => {
  res.status(200).type('text/plain').send('ok');
});

// 캐시 정책: HTML은 no-cache, 정적 에셋은 장기 캐시
app.use((req, res, next) => {
  const url = req.url.split('?')[0];

  if (/\.(?:js|css|png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|eot)$/.test(url)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1y
  } else if (url === '/' || /\.html?$/.test(url)) {
    res.setHeader('Cache-Control', 'no-cache');
  }
  next();
});

// 정적 파일 화이트리스트 서빙 (server.js 같은 내부 파일 노출 방지)
const ROOT = path.resolve(__dirname);

const staticOpts = {
  etag: true,
  // maxAge는 위 캐시 미들웨어로 제어하므로 여기선 기본값 사용
};

app.use('/css', express.static(path.join(ROOT, 'css'), staticOpts));
app.use('/js', express.static(path.join(ROOT, 'js'), staticOpts));
app.use('/images', express.static(path.join(ROOT, 'images'), staticOpts));
app.use('/pages', express.static(path.join(ROOT, 'pages'), staticOpts));

// 루트/인덱스
app.get(['/', '/index.html'], (_req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

// (선택) SPA 라우팅이 필요한 경우, 아래 주석 해제
// app.get('*', (_req, res) => {
//   res.sendFile(path.join(ROOT, 'index.html'));
// });

// 404 핸들러 (정적/정의된 라우트 외)
app.use((_req, res) => {
  res.status(404).type('text/plain').send('Not Found');
});

// 포트 바인딩: Render가 제공하는 PORT 사용 (없으면 3000)
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`soi-homestudy running on port ${PORT}`);
});
