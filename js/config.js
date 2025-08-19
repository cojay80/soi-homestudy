// js/config.js
// 전역 설정
window.SOI_CONFIG = {
  // 사용 중인 구글시트 TSV (네가 준 주소)
  sheetUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv",

  // 파이어베이스 쓸 때만 채워 넣기 (비워두면 로컬전용)
  firebase: { apiKey: "", authDomain: "", projectId: "", appId: "" }
};
