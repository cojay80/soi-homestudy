// 화면을 바꿔주는 똑똑한 집사
function render(page) {
    const container = document.getElementById('app-container');
    container.innerHTML = page;
}

// 일단은 홈 화면을 먼저 보여주자!
async function showHome() {
    const response = await fetch('../pages/home.html');
    const homeHtml = await response.text();
    render(homeHtml);
}

// 앱이 시작되면 홈 화면을 보여줘
showHome();