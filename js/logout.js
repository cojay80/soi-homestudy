// logout.js — 최종본
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-button");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // 로그인 정보 초기화
    localStorage.removeItem("currentUser");
    localStorage.removeItem("soi:points");
    localStorage.removeItem("studyData");

    // UI 초기화 이벤트 발생
    window.dispatchEvent(new Event("user:changed"));
    window.dispatchEvent(new Event("points:changed"));

    // index.html로 강제 이동 (로그인 초기화 상태로)
    window.location.href = "index.html";
  });
});
