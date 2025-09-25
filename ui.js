// UI组件交互和动画效果
class UI {
  constructor() {
    this.particles = [];
    this.fpsCounter = 0;
    this.lastTime = 0;
    this.init();
  }

  init() {
    this.createParticles();
    this.setupEventListeners();
    this.startAnimations();
  }

  // 创建粒子效果
  createParticles() {
    const container = document.getElementById('particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: absolute;
        width: 2px;
        height: 2px;
        background: rgba(255, 0, 255, 0.6);
        border-radius: 50%;
        pointer-events: none;
        animation: float ${3 + Math.random() * 4}s linear infinite;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation-delay: ${Math.random() * 2}s;
      `;
      
      container.appendChild(particle);
      this.particles.push(particle);
    }

    // 添加粒子动画CSS
    if (!document.getElementById('particle-styles')) {
      const style = document.createElement('style');
      style.id = 'particle-styles';
      style.textContent = `
        @keyframes float {
          0% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(1);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 设置事件监听器
  setupEventListeners() {
    // 菜单按钮事件
    const menuButton = document.querySelector('.nwz-menu');
    if (menuButton) {
      menuButton.addEventListener('click', () => {
        this.toggleMenu();
      });
    }

    // 全屏切换按钮事件
    const fullscreenToggle = document.getElementById('fullscreen-toggle');
    if (fullscreenToggle) {
      fullscreenToggle.addEventListener('click', () => {
        this.toggleFullscreen();
      });
    }

    // 卡片悬停效果
    const cards = document.querySelectorAll('.floating-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        this.addCardGlow(card);
      });
      
      card.addEventListener('mouseleave', () => {
        this.removeCardGlow(card);
      });
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'f':
        case 'F':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.toggleFullscreen();
          }
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
      }
    });
  }

  // 切换菜单
  toggleMenu() {
    const cards = document.querySelectorAll('.floating-card');
    cards.forEach(card => {
      card.style.display = card.style.display === 'none' ? 'block' : 'none';
    });
  }

  // 添加卡片发光效果
  addCardGlow(card) {
    card.style.boxShadow = '0 12px 40px rgba(255, 0, 255, 0.3)';
    card.style.borderColor = 'rgba(255, 0, 255, 0.5)';
  }

  // 移除卡片发光效果
  removeCardGlow(card) {
    card.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
    card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
  }

  // 开始动画循环
  startAnimations() {
    this.animate();
    this.updateRealTimeData();
  }

  // 动画循环
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const currentTime = performance.now();
    this.fpsCounter++;
    
    if (currentTime - this.lastTime >= 1000) {
      const fps = Math.round(this.fpsCounter * 1000 / (currentTime - this.lastTime));
      this.updateFPS(fps);
      this.fpsCounter = 0;
      this.lastTime = currentTime;
    }
  }

  // 更新FPS显示
  updateFPS(fps) {
    const fpsElement = document.getElementById('fps-counter');
    if (fpsElement) {
      fpsElement.textContent = fps;
      
      // 根据FPS改变颜色
      if (fps >= 55) {
        fpsElement.style.color = '#44ff44';
      } else if (fps >= 30) {
        fpsElement.style.color = '#ffff44';
      } else {
        fpsElement.style.color = '#ff4444';
      }
    }
  }

  // 更新实时数据
  updateRealTimeData() {
    setInterval(() => {
      // 模拟顶点数量变化
      const vertexCount = document.getElementById('vertex-count');
      if (vertexCount) {
        const count = Math.floor(12000 + Math.random() * 3000);
        vertexCount.textContent = count.toLocaleString();
      }

      // 模拟三角形数量变化
      const triangleCount = document.getElementById('triangle-count');
      if (triangleCount) {
        const count = Math.floor(4000 + Math.random() * 1000);
        triangleCount.textContent = count.toLocaleString();
      }
    }, 2000);
  }

  // 添加鼠标跟随效果
  addMouseFollowEffect() {
    document.addEventListener('mousemove', (e) => {
      const cursor = document.createElement('div');
      cursor.className = 'mouse-cursor';
      cursor.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: #ff00ff;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        animation: cursorFade 0.5s ease-out forwards;
      `;
      
      document.body.appendChild(cursor);
      
      setTimeout(() => {
        if (cursor.parentNode) {
          cursor.parentNode.removeChild(cursor);
        }
      }, 500);
    });

    // 添加鼠标跟随动画CSS
    if (!document.getElementById('cursor-styles')) {
      const style = document.createElement('style');
      style.id = 'cursor-styles';
      style.textContent = `
        @keyframes cursorFade {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(0);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 添加键盘快捷键
  addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'h':
        case 'H':
          // 隐藏/显示所有UI
          this.toggleUI();
          break;
        case 'm':
        case 'M':
          // 切换菜单
          this.toggleMenu();
          break;
        case 'p':
        case 'P':
          // 暂停/恢复动画
          this.togglePause();
          break;
      }
    });
  }

  // 切换UI显示
  toggleUI() {
    const uiElements = document.querySelectorAll('.floating-card, .interaction-hint');
    uiElements.forEach(element => {
      element.style.opacity = element.style.opacity === '0' ? '1' : '0';
    });
  }

  // 切换暂停状态
  togglePause() {
    // 这里可以控制Three.js动画的暂停/恢复
    if (window.isPaused) {
      window.isPaused = false;
    } else {
      window.isPaused = true;
    }
  }

  // 切换全屏
  toggleFullscreen() {
    const doc = document;
    if (!doc.fullscreenElement) {
      doc.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      doc.exitFullscreen();
    }
  }
}

// 初始化UI
document.addEventListener('DOMContentLoaded', () => {
  window.ui = new UI();
  window.ui.addMouseFollowEffect();
  window.ui.addKeyboardShortcuts();
});

// 导出UI类供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UI;
} 