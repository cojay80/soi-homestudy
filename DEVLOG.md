# 개발 로그 (DEVLOG)

> 소이의 공부방 프로젝트의 진행상황과 앞으로의 개발 계획을 기록하는 파일입니다.
> 작업할 때마다 아래 "히스토리 로그"에 새 항목을 추가하고, "다음 우선순위"를 최신 상태로 유지해주세요.

## 프로젝트 개요

- **이름**: 소이의 공부방 (SOI Home Study)
- **구성**: HTML/CSS/JS 프론트엔드 + Express/Mongoose 백엔드(`server.cjs`), MongoDB Atlas
- **문제은행**: Google Sheets 게시본(TSV)에서 로드 (`js/sheets.js`)
- **주요 기능**: 학습(퀴즈), 오답노트, 목표 관리, 포인트 상점, 학습 기록/보고서
- **원격 저장소**: https://github.com/cojay80/soi-homestudy (공개 저장소로 확인됨)

## 다음 우선순위 (진행 예정)

1. **UI 리뉴얼 마무리** — ✅ 1차 완료 (2026-08-19, 아래 "히스토리 로그" 참고). 남은 폴리시 항목:
   - `quiz.html`은 자체 `quiz-enhanced.css`(오렌지 그라데이션 톤)를 그대로 써서 기능은 정상이지만
     토카 핑크 팔레트와 색감이 약간 다름 — 우선순위 낮은 색상 통일 작업
   - report.html의 기간 선택(`.period-btn`)/차트 토글(`.chart-btn`)/업적 배지(`.badge-status`)는
     정적 마크업만 있고 `js/report.js`에 실제 토글 로직이 없어 클릭해도 아무 반응이 없음 (스타일은 입혔지만
     기능 자체가 원래 미구현 상태였음 — "기능 추가/버그 수정"에서 다룰 후보)
2. **기능 추가 / 버그 수정** — 진행 중인 것:
   - ✅ `goal.html` `<head>`/`<body>` 마크업 붕괴 수정, `logout.js` 누락 수정
   - ✅ 모바일 햄버거 메뉴가 열리지 않던 버그 수정 (`js/header.js`는 토글 로직이 있었지만 CSS가 없었음)
   - 🔲 report.html의 기간/차트/배지 UI가 실제로는 동작하지 않는 문제 (위 항목)
   - 🔲 그 외 구체적인 기능 요청은 다음 세션에서 알려주시면 이 목록에 추가
3. **PWA(홈 화면 설치) 지원** — ✅ 1차 완료 (2026-08-19). 아래 "히스토리 로그" 참고.

## 배포 (Vercel)

- 정적 파일(HTML/CSS/JS/이미지)은 그대로 정적 호스팅됨. API 3개만 `/api` 폴더의 서버리스 함수로 분리:
  `api/data/[user].js`(학습데이터 조회/저장), `api/problems.js`(구글시트 프록시, 실제로는 프런트가
  시트를 직접 호출해서 폴백용), `api/health.js`.
- **DB는 MongoDB Atlas 대신 Vercel Marketplace의 Redis(Upstash) 통합으로 교체함** (2026-08-19, 사용자 결정).
  - 이유: 기존 코드는 Mongo Atlas 별도 계정/비밀번호 관리가 필요했는데, 이 앱은 사용자 1명의 JSON 덩어리
    하나만 저장하면 되는 단순한 key-value 용도라 Redis가 더 적합. Vercel 대시보드에서 통합만 추가하면
    환경변수가 자동 주입되어 별도 가입 절차가 없음.
  - `@vercel/kv`는 조사해보니 이미 deprecated 상태(npm 확인, 2026-05-18 기준 안내문에 "Upstash Redis로
    이전되었으니 신규 프로젝트는 Marketplace에서 Redis 통합 설치" 하라고 나옴) → `@upstash/redis`를
    직접 사용하도록 구현.
  - `api/_kv.js`가 `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (신규) 또는
    `KV_REST_API_URL`/`KV_REST_API_TOKEN` (구 Vercel KV 호환 네이밍) 둘 다 확인함 — Vercel이 실제로
    어떤 이름으로 주입하는지는 Marketplace 통합 추가 후 Environment Variables 탭에서 직접 확인 필요
    (플랫폼이 계속 바뀌는 영역이라 100% 확신은 어려움).
  - `server.cjs`(로컬 `npm start`)도 같은 방식으로 동작 — 로컬에 해당 환경변수가 없으면 자동으로
    "no-db-mode"로 동작(= localStorage만 사용, 에러 없음). 로컬에서도 실제 저장을 테스트하려면
    Vercel 프로젝트 연결 후 `vercel env pull .env.local`로 값을 받아오면 됨.
  - `mongoose`, `models/UserData.js`(미사용 확인됨), 그리고 실제로 안 쓰이던 `body-parser`/`cors`/
    `node-fetch` 의존성도 함께 제거함 (`npm install`로 34개 패키지 삭제, 2개 추가 확인).
- 환경변수는 Vercel 프로젝트 Settings → Environment Variables에서 Production/Preview/Development
  모두 체크해서 등록해야 `feat/v3-renewal` 브랜치의 Preview 배포에서도 저장이 동작함.
- `vercel.json`: index.html/sw.js에 `Cache-Control: no-store` 헤더만 지정 (그 외엔 zero-config).

## 알려진 이슈 / 백로그

- ✅ ~~평문 시크릿 노출 (`js/문제집 주소.txt`)~~: 2026-08-19 삭제 완료. `feat/v3-renewal` 커밋 히스토리에도
  포함되지 않도록 처리했고 `.gitignore`에 추가함. 단, 이 파일에 있던 OpenAI 키, GitHub PAT, MongoDB 자격증명,
  Google API 키, Firebase 설정, 네이버 client id/secret은 **과거 커밋(원격에 이미 존재)에는 여전히 남아있을
  수 있으므로**, 관련 키들은 재발급을 권장함 (특히 GitHub push protection이 직접 감지한 OpenAI 키·GitHub PAT).
- 🚨 **`.env.example`의 MongoDB 자격증명**: 실제로 보이는 MongoDB URI가 원격 `main`에 이미 커밋되어 공개
  저장소에 노출된 상태. (2026-08-19, 사용자 요청으로 처리는 보류 중. 가능한 한 빨리 재발급 권장.)
- **node_modules가 git에 추적됨**: 원격 main에 `node_modules/` 하위 1,583개 파일이 커밋되어 있음.
  `.gitignore`에는 등록되어 있으나 과거 커밋에 이미 포함된 상태라 정리(`git rm -r --cached node_modules`)가 필요.
- **로컬/원격 구조 분기**: 로컬 작업본은 루트에 평면 구조(index.html, shop.html 등)이고 v3 리뉴얼이 반영된
  반면, 원격 main에는 `pages/home.html`, `pages/logs.html`, `pages/shop.html` 같은 예전 구조가 남아있어
  두 버전이 상당히 갈라져 있음. 병합 전략을 정해야 함 (원격 히스토리를 베이스로 로컬 변경분을 새 커밋으로
  얹을지, 다른 방식으로 할지).
- **테스트 부재**: `package.json`에 `"test": "jest"`가 설정되어 있지만 프로젝트 자체 테스트 파일은 없음
  (node_modules 내부 것만 존재).

## Git 상태

- 2026-08-19: 이 폴더에 로컬 git 저장소가 없었음 → `git init` 실행, `origin`을
  `https://github.com/cojay80/soi-homestudy.git`으로 연결하고 `git fetch origin` 완료.
- 로컬 v3 리뉴얼 상태를 원격 `main`(PR #57까지의 이력) 위에 새 커밋으로 올림.
- `js/문제집 주소.txt`(OpenAI 키·GitHub PAT 등 포함)는 GitHub push protection에 의해 히스토리에 남은 채로는
  push가 거부되어, 파일을 완전히 제외한 새 커밋으로 다시 만들어 히스토리 자체에 포함되지 않도록 처리함.
- `feat/v3-renewal` 브랜치를 원격에 push 완료 (main에는 아직 반영 안 함).
  PR 생성: https://github.com/cojay80/soi-homestudy/pull/new/feat/v3-renewal
- 로컬 `main` 브랜치는 이 새 커밋을 가리키고 있지만, 원격 `main`에는 아직 push하지 않음 (사용자 확인 후 진행).

## 히스토리 로그

### 2026-08-19
- 프로젝트 현황 최초 점검, `DEVLOG.md` 생성
- 보안 취약점 발견 및 원격 저장소에도 이미 노출된 것 확인 (처리는 보류)
- 로컬 git 저장소 초기화 + GitHub 원격(origin) 연결 (fetch까지만 수행, 커밋/푸시 보류)
- 다음 우선순위 확정: UI 리뉴얼 마무리, 기능 추가/버그 수정
- 원격 `main` 위에 로컬 v3 상태를 새 커밋으로 구성
- `feat/v3-renewal` push 시 GitHub push protection이 `js/문제집 주소.txt`의 OpenAI 키/GitHub PAT를
  감지해 거부 → 해당 파일을 히스토리에서 완전히 제외하고 `.gitignore`에도 추가, 재커밋 후 push 성공
- `feat/v3-renewal` 브랜치 원격 push 완료 (PR 생성 대기 중, main 반영은 보류)
- GitHub MCP 인증 실패 + Claude in Chrome 미연결로 PR을 자동 생성하지 못함 →
  PR 생성 링크(`https://github.com/cojay80/soi-homestudy/pull/new/feat/v3-renewal`)를 사용자에게 전달
- **UI 리뉴얼 1차 완료**: 2026-01-10 리뉴얼 때 `css/style.css`가 새 토카 디자인 시스템으로 전면 교체되면서
  `.card`/`.btn`/`.mini`/`.stat-card`/`.achievement-card` 등 다른 페이지가 의존하던 클래스 정의가 통째로
  사라져 있었음(사실상 깨진 상태). `css/pages-v4.css` 신규 작성으로 goal/shop/record/notes/report에서
  쓰이는 모든 클래스를 토카 스타일로 복원, `css/style.css` `:root`에 `--muted`/`--line` 레거시 별칭 추가,
  `login.html` 인디고 테마 → 토카 핑크 테마로 교체. `goal.html`의 `<head>`/`<body>` 마크업 붕괴 및
  `logout.js` 누락 수정.
- **모바일 햄버거 메뉴 버그 수정**: `js/header.js`에 드로어 토글 로직(`is-open`/`nav-open`)은 있었지만
  대응하는 CSS가 전혀 없어 모바일에서 메뉴 버튼을 눌러도 아무 반응이 없었음. `css/style.css`에
  `.mobile-menu-button`/`#nav-backdrop`/`.main-nav.is-open` 슬라이드인 드로어 스타일 추가.
- **PWA(홈 화면 설치) 지원 추가**: `manifest.json`, `sw.js`(네트워크 우선 HTML/JS + 캐시 우선 정적자원),
  `js/pwa.js`(서비스워커 등록) 신규 작성. `assets/toca/hero.png` 마스코트를 기반으로 Python Pillow로
  `icons/icon-192.png` / `icons/icon-512.png` / `icons/apple-touch-icon.png` 생성. 8개 HTML 페이지
  전체에 manifest 링크 + apple 관련 메타태그 + `pwa.js` 스크립트 태그 추가.
- 브라우저 자동화(Claude Browser pane, Claude in Chrome) 둘 다 이 세션 환경에서 사용 불가 확인
  ("Browser pane is not displayed" / 확장 미연결) → 실제 화면 스크린샷 검증은 못 하고, 서버 200 응답 /
  HTML 태그 밸런스 / CSS 중괄호 밸런스 / manifest.json 유효성 등 텍스트 기반 검증만 수행함.
  **사용자가 직접 `http://localhost:10000`을 열어 시각 확인 필요.**

### 2026-01-10 (파일 타임스탬프 기반 추정 — 실제 커밋 로그 아님)
- `index.html`을 "v3 Premium" 대시보드로 리뉴얼 (히어로 섹션, 통계 필, 학습 런처, 진행률 링, 드로어 네비)
- `assets/toca/`에 새 아이콘 세트 추가 (hero, 학습/목표/상점/보고서/오답/기록)
- `header.html`, `css/style.css`, `js/home.js` 갱신
- `login.html`, `goal.html`, `shop.html`, `record.html`, `notes.html`, `report.html`, `quiz.html` 동시 수정
  (다만 새 스타일 클래스 적용은 아직 안 된 것으로 확인 — 위 "다음 우선순위" 참고)

### 그 이전 (추정)
- v2 업그레이드 패키지(시트 로더, 뽑기/확률 시스템, 상점, 기록) 적용 완료로 보임
  (`README-UPGRADE.md`, `GIT-COMMANDS.txt`, `scripts/patch-injector.*` 참고)
