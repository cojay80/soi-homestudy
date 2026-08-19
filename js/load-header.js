/**
 * /js/load-header.js
 * 모든 페이지에서 공통으로 사용되며, #header-placeholder에 /header.html을 로드합니다.
 */
(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const placeholder = document.getElementById('header-placeholder');
        if (!placeholder) return;

        fetch('/header.html')
            .then(res => {
                if (!res.ok) throw new Error('Header load failed');
                return res.text();
            })
            .then(html => {
                placeholder.innerHTML = html;
                // 헤더 로드 완료 이벤트 발생 (필요한 경우 다른 스크립트에서 수신)
                window.dispatchEvent(new CustomEvent('header:loaded'));
            })
            .catch(err => console.error('[load-header] error:', err));
    });
})();
