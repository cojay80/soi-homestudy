# 소이의공부방 업그레이드 패키지 (분리형 v2)

이 폴더의 파일을 **레포 루트**에 그대로 복사하세요.

## 추가된 자동 스크립트
- `scripts/patch-injector.sh` (Mac/Linux)  
- `scripts/patch-injector.ps1` (Windows PowerShell)

두 파일은 `quiz.html`과 `goal.html`에 필요한 스크립트 태그를 자동으로 삽입하고, 네비게이션에 상점/기록 링크를 추가합니다.

## 수동 적용(요약)
1) `<head>`에 다음을 추가 (quiz.html에는 4개, goal.html에는 앞의 3개)
```html
<script src="/js/config.js"></script>
<script src="/js/core-auth-store.js"></script>
<script src="/js/drop.js"></script>
<script src="/js/sheets.js"></script> <!-- quiz만 -->
```
2) `quiz.html`에서 정답 제출 시 `window.__SOI__.onSubmit(선택값)` 호출 연결  
3) `goal.html`에서 체크/해제 시 `window.__SOI_TASK__.onTaskToggle(taskId, nowDone, prevAward)` 연결  
4) 네비게이션에 링크 추가
```html
<a href="/pages/shop.html">상점</a> | <a href="/pages/logs.html">기록</a>
```
