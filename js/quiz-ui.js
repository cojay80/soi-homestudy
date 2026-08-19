// 퀴즈 UI 향상 스크립트

document.addEventListener('DOMContentLoaded', () => {
  initQuizUI();
});

function initQuizUI() {
  enhanceTimer();
  enhanceProgressBar();
  enhanceAnswerOptions();
  enhanceToastMessages();
  initKeyboardShortcuts();
  initSoundEffects();
  initCelebrationEffects();
  initImageZoom();
}

// 타이머 향상
function enhanceTimer() {
  const timerDisplay = document.getElementById('timer-display');
  if (!timerDisplay) return;

  // 기존 타이머 업데이트 함수를 오버라이드하여 UI 향상
  const originalUpdateTimer = window.updateTimer;
  if (originalUpdateTimer) {
    window.updateTimer = function(seconds) {
      originalUpdateTimer(seconds);
      
      // 시간 부족 경고 (10초 이하)
      if (seconds <= 10 && seconds > 0) {
        timerDisplay.classList.add('warning');
        // 경고음 재생
        playWarningSound();
      } else {
        timerDisplay.classList.remove('warning');
      }
      
      // 시간 종료 시 효과
      if (seconds <= 0) {
        timerDisplay.classList.remove('warning');
        showTimeUpAnimation();
      }
    };
  }
}

// 진행률 바 향상
function enhanceProgressBar() {
  const progressBar = document.querySelector('.progress');
  if (!progressBar) return;
  
  // 진행률 업데이트 시 애니메이션 효과
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const width = parseInt(progressBar.style.width) || 0;
        
        // 25%, 50%, 75%, 100% 달성 시 축하 효과
        if (width === 25 || width === 50 || width === 75 || width === 100) {
          createProgressCelebration(width);
        }
      }
    });
  });
  
  observer.observe(progressBar, { attributes: true });
}

// 선택지 향상
function enhanceAnswerOptions() {
  const options = document.querySelectorAll('.option');
  
  options.forEach((option, index) => {
    // 호버 사운드 효과
    option.addEventListener('mouseenter', () => {
      playHoverSound();
    });
    
    // 클릭 애니메이션
    option.addEventListener('click', (e) => {
      // 리플 효과
      createRippleEffect(e);
      
      // 선택 애니메이션
      option.classList.add('selected');
      playClickSound();
      
      // 다른 옵션들 비활성화 표시
      options.forEach((otherOption, otherIndex) => {
        if (otherIndex !== index) {
          otherOption.style.opacity = '0.6';
          otherOption.style.transform = 'scale(0.95)';
        }
      });
    });
    
    // 키보드 접근성
    option.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        option.click();
      }
    });
  });
}

// 토스트 메시지 향상
function enhanceToastMessages() {
  // 기존 토스트 함수 오버라이드
  window.showToast = function(message, type, duration = 2000) {
    const toast = document.getElementById('toast-message');
    if (!toast) return;
    
    // 토스트 내용 구성
    const icon = type === 'correct' ? '🎉' : '😅';
    const title = type === 'correct' ? '정답!' : '아쉬워요';
    
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    `;
    
    toast.className = `show ${type}`;
    
    // 정답 시 축하 효과
    if (type === 'correct') {
      createConfettiEffect();
      playSuccessSound();
    } else {
      playErrorSound();
    }
    
    // 자동 숨김
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  };
}

// 키보드 단축키
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // 숫자 키로 선택지 선택
    if (e.key >= '1' && e.key <= '4') {
      const optionIndex = parseInt(e.key) - 1;
      const option = document.querySelectorAll('.option')[optionIndex];
      if (option && !option.disabled) {
        option.click();
      }
    }
    
    // 스페이스바로 다음 문제
    if (e.key === ' ' && e.target.tagName !== 'INPUT') {
      e.preventDefault();
      const nextButton = document.querySelector('#feedback-continue, #main-menu-button');
      if (nextButton && nextButton.style.display !== 'none') {
        nextButton.click();
      }
    }
    
    // ESC로 메인 메뉴
    if (e.key === 'Escape') {
      if (confirm('정말 메인 메뉴로 돌아가시겠습니까?')) {
        window.location.href = 'index.html';
      }
    }
  });
}

// 사운드 효과
function initSoundEffects() {
  // 사운드 설정 확인
  const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
  if (!soundEnabled) return;
  
  // 사운드 객체들
  window.quizSounds = {
    hover: createAudioElement('/dingdong.wav', 0.1),
    click: createAudioElement('/dingdong.wav', 0.2),
    success: createAudioElement('/dingdong.wav', 0.3),
    error: createAudioElement('/ddang.wav', 0.3),
    warning: createAudioElement('/ddang.wav', 0.2)
  };
}

function createAudioElement(src, volume = 0.3) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.preload = 'auto';
    return audio;
  } catch (e) {
    return null;
  }
}

function playHoverSound() {
  playSound(window.quizSounds?.hover);
}

function playClickSound() {
  playSound(window.quizSounds?.click);
}

function playSuccessSound() {
  playSound(window.quizSounds?.success);
}

function playErrorSound() {
  playSound(window.quizSounds?.error);
}

function playWarningSound() {
  playSound(window.quizSounds?.warning);
}

function playSound(audio) {
  if (!audio) return;
  
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {
      // 사운드 재생 실패 시 무시
    });
  } catch (e) {
    // 사운드 재생 실패 시 무시
  }
}

// 축하 효과
function initCelebrationEffects() {
  // 컨페티 효과용 컨테이너 생성
  const celebrationContainer = document.createElement('div');
  celebrationContainer.className = 'celebration';
  celebrationContainer.id = 'celebration-container';
  document.body.appendChild(celebrationContainer);
}

// 리플 효과 생성
function createRippleEffect(event) {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 0.6s linear;
    pointer-events: none;
    z-index: 1;
  `;
  
  button.style.position = 'relative';
  button.appendChild(ripple);
  
  // 애니메이션 완료 후 제거
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

// 컨페티 효과
function createConfettiEffect() {
  const container = document.getElementById('celebration-container');
  if (!container) return;
  
  const colors = ['#FFD700', '#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
  const confettiCount = 50;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-delay: ${Math.random() * 3}s;
      animation-duration: ${3 + Math.random() * 2}s;
    `;
    
    container.appendChild(confetti);
    
    // 애니메이션 완료 후 제거
    setTimeout(() => {
      confetti.remove();
    }, 5000);
  }
}

// 진행률 축하 효과
function createProgressCelebration(progress) {
  const messages = {
    25: '1/4 완료! 🎯',
    50: '절반 완료! 💪',
    75: '3/4 완료! 🔥',
    100: '모든 문제 완료! 🎉'
  };
  
  const message = messages[progress];
  if (message) {
    showMiniCelebration(message);
  }
}

// 미니 축하 효과
function showMiniCelebration(message) {
  const celebration = document.createElement('div');
  celebration.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #FFD700, #FF6B9D);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 25px;
    font-weight: 600;
    font-size: 1.1rem;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    z-index: 1500;
    transform: translateX(100%);
    transition: transform 0.4s ease;
  `;
  
  celebration.textContent = message;
  document.body.appendChild(celebration);
  
  // 애니메이션 시작
  setTimeout(() => {
    celebration.style.transform = 'translateX(0)';
  }, 100);
  
  // 자동 제거
  setTimeout(() => {
    celebration.style.transform = 'translateX(100%)';
    setTimeout(() => {
      celebration.remove();
    }, 400);
  }, 2500);
}

// 시간 종료 애니메이션
function showTimeUpAnimation() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(220, 53, 69, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: timeup-flash 0.5s ease;
  `;
  
  overlay.innerHTML = `
    <div style="
      background: white;
      padding: 2rem;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
      animation: timeup-bounce 0.6s ease;
    ">
      <div style="font-size: 4rem; margin-bottom: 1rem;">⏰</div>
      <h2 style="color: #DC3545; margin: 0 0 0.5rem 0;">시간 종료!</h2>
      <p style="color: #666; margin: 0;">다음 문제로 넘어갑니다</p>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // 3초 후 자동 제거
  setTimeout(() => {
    overlay.style.animation = 'timeup-fadeout 0.5s ease';
    setTimeout(() => {
      overlay.remove();
    }, 500);
  }, 3000);
}

// 문제 전환 애니메이션
function animateQuestionTransition() {
  const questionBox = document.querySelector('.question-box');
  const options = document.querySelectorAll('.option');
  
  if (questionBox) {
    questionBox.style.animation = 'question-slide-in 0.5s ease';
  }
  
  options.forEach((option, index) => {
    option.style.animation = `option-slide-in 0.3s ease ${index * 0.1}s both`;
    option.style.opacity = '1';
    option.style.transform = 'none';
    option.disabled = false;
  });
}

// 정답 표시 애니메이션
function showCorrectAnswer(correctIndex) {
  const options = document.querySelectorAll('.option');
  const correctOption = options[correctIndex - 1];
  
  if (correctOption) {
    correctOption.classList.add('correct');
    
    // 정답 강조 효과
    setTimeout(() => {
      correctOption.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }
}

// 오답 표시 애니메이션
function showWrongAnswer(selectedIndex, correctIndex) {
  const options = document.querySelectorAll('.option');
  const selectedOption = options[selectedIndex - 1];
  const correctOption = options[correctIndex - 1];
  
  if (selectedOption) {
    selectedOption.classList.add('wrong');
  }
  
  if (correctOption && correctOption !== selectedOption) {
    setTimeout(() => {
      correctOption.classList.add('correct');
    }, 600);
  }
}

// 결과 화면 애니메이션
function animateResults() {
  const resultsContainer = document.getElementById('results-container');
  if (!resultsContainer) return;
  
  resultsContainer.style.animation = 'results-slide-up 0.8s ease';
  
  // 통계 애니메이션
  const scoreText = document.getElementById('score-text');
  if (scoreText) {
    animateNumberCount(scoreText);
  }
}

// 숫자 카운트 애니메이션
function animateNumberCount(element) {
  const text = element.textContent;
  const numbers = text.match(/\d+/g);
  
  if (numbers && numbers.length > 0) {
    const targetNum = parseInt(numbers[0]);
    let currentNum = 0;
    const increment = Math.ceil(targetNum / 20);
    const duration = 1000;
    const stepTime = duration / (targetNum / increment);
    
    const timer = setInterval(() => {
      currentNum += increment;
      if (currentNum >= targetNum) {
        currentNum = targetNum;
        clearInterval(timer);
      }
      element.textContent = text.replace(/\d+/, currentNum);
    }, stepTime);
  }
}

// 이미지 확대 기능
function initImageZoom() {
  const questionImage = document.getElementById('question-image');
  if (!questionImage) return;
  
  questionImage.addEventListener('click', () => {
    showImageModal(questionImage.src);
  });
}

function showImageModal(imageSrc) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
    cursor: pointer;
  `;
  
  modal.innerHTML = `
    <img src="${imageSrc}" style="
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
    ">
    <button style="
      position: absolute;
      top: 20px;
      right: 20px;
      background: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    ">×</button>
  `;
  
  document.body.appendChild(modal);
  
  // 닫기 이벤트
  modal.addEventListener('click', () => {
    modal.remove();
  });
}

// CSS 애니메이션 추가
const additionalAnimations = `
  @keyframes timeup-flash {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  
  @keyframes timeup-bounce {
    0% { transform: scale(0.3); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  @keyframes timeup-fadeout {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }
  
  @keyframes question-slide-in {
    from { transform: translateX(30px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes option-slide-in {
    from { transform: translateX(20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes results-slide-up {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;

// 스타일 시트 추가
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalAnimations;
document.head.appendChild(styleSheet);

// 전역 함수로 노출
window.animateQuestionTransition = animateQuestionTransition;
window.showCorrectAnswer = showCorrectAnswer;
window.showWrongAnswer = showWrongAnswer;
window.animateResults = animateResults;
window.initImageZoom = initImageZoom;