// js/header.js (서버 연동 최종 버전)

document.addEventListener('DOMContentLoaded', () => {
    // ======== 공통 헤더 기능 (사용자 정보 및 로그아웃) ========
    const currentUser = localStorage.getItem('currentUser');
    const welcomeMsgElement = document.getElementById('welcome-message');
    const logoutBtnElement = document.getElementById('logout-button');
    const userInfoElement = document.querySelector('.user-info');
    
    // 로그인 상태가 아니면, quiz, record 등 서브페이지에서 로그인 페이지로 리디렉션
    const isSubPage = !window.location.pathname.endsWith('/') && !window.location.pathname.endsWith('index.html');
    if (!currentUser && isSubPage) {
        alert("사용자 정보가 없습니다. 메인 화면에서 사용자를 선택해주세요.");
        window.location.href = 'index.html';
        return;
    }
    
    if (currentUser && userInfoElement) {
        userInfoElement.style.visibility = 'visible';
        if (welcomeMsgElement) welcomeMsgElement.textContent = `${currentUser}님, 환영합니다!`;
        if (logoutBtnElement) {
            logoutBtnElement.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('currentUser');
                localStorage.removeItem('studyData'); // 로컬 데이터도 클리어
                window.location.href = 'index.html';
            });
        }
    } else if (userInfoElement) {
        userInfoElement.style.visibility = 'hidden';
    }

    // ======== 공통 헤더 기능 (모바일 메뉴 버튼) ========
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mainNav = document.querySelector('.main-nav');

    if (mobileMenuButton && mainNav) {
        mobileMenuButton.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }
});