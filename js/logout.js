<script>
// js/logout.js — ?reset=1 처리
(function(){
  function doLogout(){
    // 필요한 키만 정리 (원하면 아래 주석 풀어서 전부 삭제 가능)
    // localStorage.clear();

    // 로그인만 초기화
    localStorage.removeItem('currentUser');
    // 페이지 이동
    location.href = 'index.html';
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const url = new URL(location.href);
    if (url.searchParams.get('reset') === '1') {
      doLogout();
    }
  });
})();
</script>
