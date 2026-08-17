// ============================================
// 动态渐变弥散粒子背景动画
// 用于 CTA 区块
// ============================================

function initParticles(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let hue = 0; // 用于渐变颜色循环

  // 粒子配置
  const PARTICLE_COUNT = 60;
  const CONNECT_DISTANCE = 120;
  const SPEED = 0.4;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = canvas.width = rect.width;
    height = canvas.height = rect.height;
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        radius: Math.random() * 2.5 + 1,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
  }

  function drawGradientBg() {
    // 动态渐变背景，颜色缓慢循环
    const h1 = hue % 360;
    const h2 = (hue + 40) % 360;
    const h3 = (hue + 80) % 360;

    const gradient = ctx.createRadialGradient(
      width * 0.3, height * 0.3, 0,
      width * 0.5, height * 0.5, Math.max(width, height) * 0.8
    );
    gradient.addColorStop(0, `hsla(${h1}, 60%, 25%, 1)`);
    gradient.addColorStop(0.5, `hsla(${h2}, 50%, 18%, 1)`);
    gradient.addColorStop(1, `hsla(${h3}, 40%, 12%, 1)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    hue += 0.15; // 颜色变化速度
  }

  function drawParticles() {
    // 绘制粒子连线
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECT_DISTANCE) {
          const opacity = (1 - dist / CONNECT_DISTANCE) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // 绘制粒子
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
      ctx.fill();

      // 粒子发光效果
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
      glow.addColorStop(0, `rgba(255, 255, 255, ${p.opacity * 0.3})`);
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function updateParticles() {
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      // 边界反弹
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      p.x = Math.max(0, Math.min(width, p.x));
      p.y = Math.max(0, Math.min(height, p.y));
    });
  }

  function animate() {
    drawGradientBg();
    updateParticles();
    drawParticles();
    requestAnimationFrame(animate);
  }

  // 初始化
  resize();
  createParticles();
  animate();

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });
}
