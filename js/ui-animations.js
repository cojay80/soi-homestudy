// UI 애니메이션 및 인터랙션 스크립트

document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initButtonEffects();
  initProgressAnimations();
  initTooltips();
  initParticleEffects();
  initSoundEffects();
});

// 스크롤 애니메이션
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);

  // 애니메이션 대상 요소들
  const animateElements = document.querySelectorAll('.card, .stat-card, .shortcut-item');
  animateElements.forEach(el => {
    el.classList.add('animate-element');
    observer.observe(el);
  });
}

// 버튼 효과
function initButtonEffects() {
  const buttons = document.querySelectorAll('.btn');
  
  buttons.forEach(button => {
    // 리플 효과
    button.addEventListener('click', createRippleEffect);
    
    // 터치 피드백
    button.addEventListener('touchstart', () => {
      button.style.transform = 'scale(0.95)';
    });
    
    button.addEventListener('touchend', () => {
      setTimeout(() => {
        button.style.transform = '';
      }, 150);
    });
  });
}

// 리플 효과 생성
function createRippleEffect(e) {
  const button = e.currentTarget;
  const rect = button.getBoundingClientRect();
  const ripple = document.createElement('span');
  
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  
  ripple.classList.add('ripple');
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  
  button.appendChild(ripple);
  
  // 리플 애니메이션 후 제거
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

// 진행률 애니메이션
function initProgressAnimations() {
  const progressRing = document.getElementById('progress-circle');
  if (progressRing) {
    const circumference = 2 * Math.PI * 40;
    progressRing.style.strokeDasharray = circumference;
    
    // 초기 상태
    progressRing.style.strokeDashoffset = circumference;
    
    // 애니메이션 시작
    setTimeout(() => {
      updateProgressRing();
    }, 500);
  }
  
  // 숫자 카운트업 애니메이션
  animateCountUp('today-total');
  animateCountUp('today-correct');
  animateCountUp('total-points');
}

// 진행률 링 업데이트
function updateProgressRing() {
  const progressText = document.getElementById('today-progress');
  const progressRing = document.getElementById('progress-circle');
  
  if (!progressText || !progressRing) return;
  
  const progress = parseInt(progressText.textContent) || 0;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (progress / 100) * circumference;
  
  progressRing.style.strokeDashoffset = offset;
}

// 숫자 카운트업 애니메이션
function animateCountUp(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const targetText = element.textContent;
  const targetNum = parseInt(targetText.replace(/\D/g, '')) || 0;
  const suffix = targetText.replace(/\d/g, '');
  
  let currentNum = 0;
  const increment = Math.ceil(targetNum / 30);
  const duration = 1000;
  const stepTime = duration / (targetNum / increment);
  
  const timer = setInterval(() => {
    currentNum += increment;
    if (currentNum >= targetNum) {
      currentNum = targetNum;
      clearInterval(timer);
    }
    element.textContent = currentNum + suffix;
  }, stepTime);
}

// 툴팁 초기화
function initTooltips() {
  const tooltipElements = document.querySelectorAll('[title]');
  
  tooltipElements.forEach(element => {
    const title = element.getAttribute('title');
    element.removeAttribute('title');
    
    // 커스텀 툴팁 생성
    element.addEventListener('mouseenter', (e) => {
      showTooltip(e.target, title);
    });
    
    element.addEventListener('mouseleave', () => {
      hideTooltip();
    });
  });
}

// 툴팁 표시
function showTooltip(element, text) {
  const tooltip = document.createElement('div');
  tooltip.className = 'custom-tooltip';
  tooltip.textContent = text;
  
  document.body.appendChild(tooltip);
  
  const rect = element.getBoundingClientRect();
  tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
  tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
  
  setTimeout(() => tooltip.classList.add('show'), 10);
}

// 툴팁 숨기기
function hideTooltip() {
  const tooltip = document.querySelector('.custom-tooltip');
  if (tooltip) {
    tooltip.classList.remove('show');
    setTimeout(() => tooltip.remove(), 300);
  }
}

// 파티클 효과
function initParticleEffects() {
  // 성공 시 파티클 효과
  window.showSuccessParticles = function(element) {
    const particles = [];
    const colors = ['#FFD700', '#FF6B9D', '#4ECDC4', '#45B7D1'];
    
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'success-particle';
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      
      const rect = element.getBoundingClientRect();
      particle.style.left = rect.left + rect.width / 2 + 'px';
      particle.style.top = rect.top + rect.height / 2 + 'px';
      
      document.body.appendChild(particle);
      particles.push(particle);
      
      // 랜덤 방향으로 파티클 이동
      const angle = (Math.PI * 2 * i) / 15;
      const velocity = 100 + Math.random() * 100;
      
      const deltaX = Math.cos(angle) * velocity;
      const deltaY = Math.sin(angle) * velocity;
      
      particle.animate([
        {
          transform: 'translate(0, 0) scale(1)',
          opacity: 1
        },
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(0)`,
          opacity: 0
        }
      ], {
        duration: 1000 + Math.random() * 500,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).onfinish = () => particle.remove();
    }
  };
}

// 사운드 효과
function initSoundEffects() {
  // 사운드 설정 확인
  const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
  
  if (!soundEnabled) return;
  
  // 사운드 객체들
  const sounds = {
    click: createSound('/dingdong.wav'),
    error: createSound('/ddang.wav'),
    success: createSound('/dingdong.wav')
  };
  
  // 버튼 클릭 사운드
  document.addEventListener('click', (e) => {
    if (e.target.matches('.btn, button')) {
      playSound(sounds.click);
    }
  });
  
  // 전역 사운드 함수
  window.playSuccessSound = () => playSound(sounds.success);
  window.playErrorSound = () => playSound(sounds.error);
}

// 사운드 생성
function createSound(src) {
  const audio = new Audio(src);
  audio.volume = 0.3;
  return audio;
}

// 사운드 재생
function playSound(audio) {
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {
      // 사운드 재생 실패 시 무시
    });
  } catch (e) {
    // 사운드 재생 실패 시 무시
  }
}

// 폼 유효성 검사 애니메이션
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  field.classList.add('error');
  field.style.animation = 'shake 0.5s ease-in-out';
  
  // 에러 메시지 표시
  let errorMsg = field.parentNode.querySelector('.field-error');
  if (!errorMsg) {
    errorMsg = document.createElement('div');
    errorMsg.className = 'field-error';
    field.parentNode.appendChild(errorMsg);
  }
  
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
  
  // 자동 정리
  setTimeout(() => {
    field.classList.remove('error');
    field.style.animation = '';
  }, 500);
  
  // 포커스 시 에러 제거
  field.addEventListener('focus', () => {
    field.classList.remove('error');
    if (errorMsg) errorMsg.style.display = 'none';
  }, { once: true });
}

// 성공 메시지 애니메이션
function showSuccessMessage(message, duration = 3000) {
  const successMsg = document.createElement('div');
  successMsg.className = 'success-message';
  successMsg.innerHTML = `
    <span class="success-icon">✅</span>
    <span class="success-text">${message}</span>
  `;
  
  document.body.appendChild(successMsg);
  
  // 애니메이션 시작
  setTimeout(() => successMsg.classList.add('show'), 10);
  
  // 자동 제거
  setTimeout(() => {
    successMsg.classList.remove('show');
    setTimeout(() => successMsg.remove(), 300);
  }, duration);
}

// 로딩 스피너 표시/숨기기
function showLoadingSpinner(element) {
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.innerHTML = `
    <div class="spinner-ring">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  `;
  
  element.appendChild(spinner);
  return spinner;
}

function hideLoadingSpinner(spinner) {
  if (spinner && spinner.parentNode) {
    spinner.remove();
  }
}

// 페이지 전환 애니메이션
function pageTransition(url) {
  document.body.classList.add('page-transition');
  
  setTimeout(() => {
    window.location.href = url;
  }, 300);
}

// 전역 함수 노출
window.showFieldError = showFieldError;
window.showSuccessMessage = showSuccessMessage;
window.showLoadingSpinner = showLoadingSpinner;
window.hideLoadingSpinner = hideLoadingSpinner;
window.pageTransition = pageTransition;

// CSS 추가 (동적으로 스타일 추가)
const additionalStyles = `
  .animate-element {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.6s ease;
  }
  
  .animate-element.animate-in {
    opacity: 1;
    transform: translateY(0);
  }
  
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    pointer-events: none;
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  .custom-tooltip {
    position: absolute;
    background: #333;
    color: white;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    white-space: nowrap;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .custom-tooltip.show {
    opacity: 1;
  }
  
  .custom-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: #333;
  }
  
  .success-particle {
    position: fixed;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 1000;
  }
  
  .field-error {
    color: #D32F2F;
    font-size: 0.8rem;
    margin-top: 0.25rem;
    display: none;
  }
  
  .form-select.error,
  .form-input.error {
    border-color: #D32F2F !important;
    box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.1) !important;
  }
  
  .success-message {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  
  .success-message.show {
    transform: translateX(0);
  }
  
  .loading-spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  
  .spinner-ring {
    display: inline-block;
    position: relative;
    width: 40px;
    height: 40px;
  }
  
  .spinner-ring div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: 32px;
    height: 32px;
    margin: 4px;
    border: 3px solid var(--brand);
    border-radius: 50%;
    animation: spinner-ring-animation 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: var(--brand) transparent transparent transparent;
  }
  
  .spinner-ring div:nth-child(1) { animation-delay: -0.45s; }
  .spinner-ring div:nth-child(2) { animation-delay: -0.3s; }
  .spinner-ring div:nth-child(3) { animation-delay: -0.15s; }
  
  @keyframes spinner-ring-animation {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .page-transition {
    opacity: 0;
    transform: scale(0.95);
    transition: all 0.3s ease;
  }
`;

// 스타일 시트 추가
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);