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

1. **UI 리뉴얼 마무리** — 2026-01-10에 `index.html`/`header.html`이 새 "v3 프리미엄 / 토카" 스타일로
   전환됐지만, 아래 7개 페이지는 아직 예전 스타일 그대로임 (확인 결과 `ui-enhanced.css`/`glass`/토카 아이콘 미적용):
   - `login.html`, `quiz.html`, `goal.html`, `shop.html`, `record.html`, `report.html`, `notes.html`
   - (`report.html`만 `css/ui-enhanced.css`를 링크하고 있음 — 부분 적용 상태)
2. **기능 추가 / 버그 수정** — 구체적인 항목 미정. 다음 세션에서 구체적으로 알려주시면 이 목록에 추가합니다.

## 알려진 이슈 / 백로그

- 🚨 **평문 시크릿 노출**: `js/문제집 주소.txt`에 MongoDB URI, OpenAI API 키, Google API 키, GitHub PAT,
  Firebase 설정, 네이버 client id/secret이 평문으로 존재. `.gitignore`가 이 파일을 막지 않음.
  또한 **`.env.example`에 실제로 보이는 MongoDB 자격증명이 이미 GitHub 원격(main)에도 커밋되어 있는 것을
  확인함** — 즉 이미 공개 저장소에 노출된 상태. (2026-08-19, 사용자 요청으로 처리는 보류 중. 관련 키는
  가능한 한 빨리 재발급 권장.)
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
- 아직 로컬 커밋/푸시는 하지 않음 — 위 "로컬/원격 구조 분기" 문제의 병합 전략을 사용자와 상의 후 진행 예정.

## 히스토리 로그

### 2026-08-19
- 프로젝트 현황 최초 점검, `DEVLOG.md` 생성
- 보안 취약점 발견 및 원격 저장소에도 이미 노출된 것 확인 (처리는 보류)
- 로컬 git 저장소 초기화 + GitHub 원격(origin) 연결 (fetch까지만 수행, 커밋/푸시 보류)
- 다음 우선순위 확정: UI 리뉴얼 마무리, 기능 추가/버그 수정

### 2026-01-10 (파일 타임스탬프 기반 추정 — 실제 커밋 로그 아님)
- `index.html`을 "v3 Premium" 대시보드로 리뉴얼 (히어로 섹션, 통계 필, 학습 런처, 진행률 링, 드로어 네비)
- `assets/toca/`에 새 아이콘 세트 추가 (hero, 학습/목표/상점/보고서/오답/기록)
- `header.html`, `css/style.css`, `js/home.js` 갱신
- `login.html`, `goal.html`, `shop.html`, `record.html`, `notes.html`, `report.html`, `quiz.html` 동시 수정
  (다만 새 스타일 클래스 적용은 아직 안 된 것으로 확인 — 위 "다음 우선순위" 참고)

### 그 이전 (추정)
- v2 업그레이드 패키지(시트 로더, 뽑기/확률 시스템, 상점, 기록) 적용 완료로 보임
  (`README-UPGRADE.md`, `GIT-COMMANDS.txt`, `scripts/patch-injector.*` 참고)
