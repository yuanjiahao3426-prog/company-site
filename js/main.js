// ============================================
// 通用脚本 —— 导航栏、Hero轮播、数据加载、分类渲染
// ============================================

// ---------- 导航栏滚动效果 ----------
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  // 默认就有半透明背景，滚动后加阴影
  if (window.scrollY > 20) navbar.classList.add('scrolled');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // 移动端菜单
  const toggle = document.querySelector('.menu-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }
}

// ---------- Hero 16:9 轮播 ----------
function initHeroCarousel() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  const prevBtn = document.querySelector('.hero-arrow.prev');
  const nextBtn = document.querySelector('.hero-arrow.next');
  if (!slides.length) return;

  let current = 0;
  let timer = null;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current]?.classList.add('active');

    // 重置内容动画
    const content = slides[current].querySelector('.hero-content');
    if (content) {
      content.querySelectorAll('h1, p, .hero-btn').forEach(el => {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = '';
      });
    }
  }

  function startAuto() {
    stopAuto();
    timer = setInterval(() => goTo(current + 1), 6000);
  }

  function stopAuto() {
    if (timer) clearInterval(timer);
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    goTo(i);
    startAuto();
  }));
  prevBtn?.addEventListener('click', () => { goTo(current - 1); startAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(current + 1); startAuto(); });

  // 鼠标悬停暂停
  const hero = document.querySelector('.hero');
  hero?.addEventListener('mouseenter', stopAuto);
  hero?.addEventListener('mouseleave', startAuto);

  startAuto();
}

// ---------- 从 Supabase 加载作品数据 ----------
async function loadProjects(categoryIndex = null) {
  const sb = getSupabase();
  if (!sb) {
    return getSampleProjects();
  }
  try {
    let query = sb.from('projects').select('*').order('sort_order', { ascending: true });
    if (categoryIndex !== null) {
      query = query.eq('category_index', categoryIndex);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('加载作品失败:', e);
    return getSampleProjects();
  }
}

// ---------- 加载单个作品详情 ----------
async function loadProjectById(id) {
  const sb = getSupabase();
  if (!sb) {
    const all = getSampleProjects();
    return all.find(p => p.id == id) || all[0];
  }
  try {
    const { data, error } = await sb.from('projects').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('加载作品详情失败:', e);
    const all = getSampleProjects();
    return all.find(p => p.id == id) || all[0];
  }
}

// ---------- 从 Supabase 加载 Hero 轮播图 ----------
async function loadHeroSlides() {
  const sb = getSupabase();
  if (!sb) return getSampleHeroSlides();
  try {
    const { data, error } = await sb.from('hero_slides').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    return data && data.length ? data : getSampleHeroSlides();
  } catch (e) {
    return getSampleHeroSlides();
  }
}

// ---------- 加载分类配置 ----------
async function loadCategories() {
  const sb = getSupabase();
  if (!sb) return DEFAULT_CATEGORIES;
  try {
    const { data, error } = await sb.from('site_config').select('value').eq('key', 'categories').single();
    if (error || !data) return DEFAULT_CATEGORIES;
    return data.value || DEFAULT_CATEGORIES;
  } catch (e) {
    return DEFAULT_CATEGORIES;
  }
}

// ---------- 示例数据（未配置 Supabase 时使用） ----------
function getSampleProjects() {
  return [
    {
      id: 1, title: 'Oravida 兰维乐品牌空间', subtitle: '提升品牌空间体验',
      category_index: 0,
      cover: 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800',
      client: 'Oravida 兰维乐', year: '2024',
      content: '<h2>项目背景</h2><p>Oravida 兰维乐作为高端水品牌，希望通过线下零售空间传递品牌的自然与纯净理念。我们受邀为其打造全新的品牌体验空间。</p><img src="https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1200" alt="空间实景"><h2>设计策略</h2><p>我们以"水的形态"为核心灵感，将空间划分为流动的体验区域。使用天然石材、原木和玻璃材质，营造出纯净而富有层次感的空间氛围。</p><blockquote>好的空间设计，是让品牌自己说话。</blockquote><h3>空间亮点</h3><ul><li>入口处艺术装置，模拟水滴坠落的瞬间</li><li>产品展示区采用悬浮式展柜</li><li>品鉴区设置沉浸式光影体验</li></ul><p>项目落地后，门店客流量提升了 40%，客户停留时间平均增加 15 分钟。</p>'
    },
    {
      id: 2, title: 'JMGO 坚果投影 Bonfire OS', subtitle: '全新系统视觉设计',
      category_index: 2,
      cover: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800',
      client: 'JMGO 坚果', year: '2024',
      content: '<h2>项目概述</h2><p>为坚果投影全新打造的 Bonfire OS 系统，我们采用强大的游戏引擎搭建四大空间全新视觉，重新定义投影系统的交互体验。</p><img src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=1200" alt="系统界面"><h2>设计理念</h2><p>以"沉浸 不止观影"为核心主张，将投影系统从单纯的播放工具升级为家庭娱乐中心。四大空间分别对应不同的使用场景。</p><h3>四大空间</h3><ol><li><strong>观影空间</strong>：极简播放器界面，减少视觉干扰</li><li><strong>音乐空间</strong>：动态可视化效果，随音乐律动</li><li><strong>游戏空间</strong>：低延迟模式，专为游戏优化</li><li><strong>氛围空间</strong>：多种场景化壁纸，营造氛围</li></ol>'
    },
    {
      id: 3, title: 'Campfire AR 设计协作', subtitle: '助力实现AR设计协作的未来',
      category_index: 1,
      cover: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=800',
      client: 'Campfire', year: '2023',
      content: '<h2>挑战</h2><p>远程团队的设计协作一直是行业痛点。传统的视频会议和屏幕共享无法满足三维设计的评审需求。</p><img src="https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=1200" alt="AR协作"><h2>解决方案</h2><p>我们设计了一套基于 AR 技术的协作系统，让分散在各地的团队成员可以在同一个虚拟空间中评审三维模型。</p><blockquote>让距离不再是设计的障碍。</blockquote><p>系统支持实时标注、手势交互和多端同步，大幅提升了远程设计评审的效率。</p>'
    },
    {
      id: 4, title: '小米智能家居交互升级', subtitle: '为米家产品持续优化交互体验',
      category_index: 1,
      cover: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800',
      client: '小米', year: '2023',
      content: '<h2>项目背景</h2><p>小米米家拥有数百款智能设备，如何让用户在统一的 APP 中轻松管理所有设备，是我们面临的核心挑战。</p><img src="https://images.unsplash.com/photo-1558002038-1055907df827?w=1200" alt="智能家居"><h2>交互优化</h2><p>我们重新设计了设备控制的交互逻辑，引入场景化控制和智能推荐，让复杂的智能家居变得简单易用。</p>'
    },
    {
      id: 5, title: 'Orchid 开放互联网生态', subtitle: '打造开放互联网生态',
      category_index: 2,
      cover: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      client: 'Orchid', year: '2023',
      content: '<h2>品牌愿景</h2><p>Orchid 致力于打造一个开放、去中心化的互联网生态。我们为其设计了完整的品牌视觉系统和产品界面。</p><img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200" alt="产品界面"><h2>设计语言</h2><p>以自然、有机的图形语言传达"开放"与"自由"的品牌精神。绿色主色调象征生机与连接。</p>'
    },
    {
      id: 6, title: '远程医疗工具箱', subtitle: '协助开展线上诊疗',
      category_index: 3,
      cover: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
      client: '医疗科技', year: '2022',
      content: '<h2>社会价值</h2><p>疫情期间，远程医疗需求激增。我们设计了一套面向基层医生的远程医疗工具箱，帮助他们快速开展线上诊疗服务。</p><img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200" alt="远程医疗"><h2>功能设计</h2><p>工具箱包含在线问诊、电子处方、病历管理和健康监测四大模块，界面简洁直观，即使是不熟悉数字工具的医生也能快速上手。</p><blockquote>技术应该让医疗更有温度。</blockquote>'
    },
    {
      id: 7, title: '韧性城市更新计划', subtitle: '气候适应性城市空间设计',
      category_index: 0,
      cover: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
      client: '城市发展局', year: '2024',
      content: '<h2>研究背景</h2><p>气候变化给城市带来了前所未有的挑战。我们与城市发展局合作，探索如何通过空间设计提升城市的气候韧性。</p><img src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200" alt="城市空间"><h2>设计策略</h2><p>从雨水管理、热岛效应缓解到公共空间多功能化，我们提出了一套系统性的城市更新方案。</p>'
    },
    {
      id: 8, title: '老字号品牌视觉重塑', subtitle: '传统品牌的年轻化转型',
      category_index: 3,
      cover: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
      client: '老字号集团', year: '2024',
      content: '<h2>品牌困境</h2><p>拥有百年历史的老字号品牌，面临年轻消费者流失的困境。如何在保留品牌底蕴的同时，吸引新一代消费者？</p><img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200" alt="品牌视觉"><h2>重塑方案</h2><p>我们从品牌故事中提取核心元素，用现代设计语言重新演绎。新的视觉系统既保留了传统韵味，又充满时代感。</p>'
    },
  ];
}

function getSampleHeroSlides() {
  return [
    {
      id: 1,
      title: '将大胆的想法变为现实',
      subtitle: '想象并构筑颠覆式创新的体验、产品和商业模式',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920',
      caption: '品牌空间设计项目'
    },
    {
      id: 2,
      title: '以设计驱动商业增长',
      subtitle: '我们相信好的设计能够改变人与产品的关系',
      image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920',
      caption: '城市更新项目'
    },
    {
      id: 3,
      title: '韧性城市的新理念',
      subtitle: '设计如何缩小气候风险与气候准备之间的差距',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920',
      caption: '城市规划研究项目'
    },
  ];
}

// 分类封面图（示例）
function getCategoryCovers() {
  return [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
  ];
}

// ---------- 渲染 Hero 轮播 ----------
async function renderHero() {
  const slidesContainer = document.querySelector('.hero-slides');
  const dotsContainer = document.querySelector('.hero-dots');
  if (!slidesContainer) return;

  const slides = await loadHeroSlides();
  slidesContainer.innerHTML = slides.map((s, i) => `
    <div class="hero-slide ${i === 0 ? 'active' : ''}" style="background-image:url('${s.image}')">
      <div class="hero-content">
        <h1>${s.title}</h1>
        <p>${s.subtitle || ''}</p>
        <a href="#categories" class="hero-btn">浏览作品</a>
      </div>
      ${s.caption ? `<div class="hero-caption">${s.caption}</div>` : ''}
    </div>
  `).join('');

  if (dotsContainer) {
    dotsContainer.innerHTML = slides.map((_, i) =>
      `<div class="hero-dot ${i === 0 ? 'active' : ''}"></div>`
    ).join('');
  }

  initHeroCarousel();
}

// ---------- 渲染四分类图文区块 ----------
async function renderCategories() {
  const grid = document.querySelector('.categories-grid');
  if (!grid) return;

  const categories = await loadCategories();
  const covers = getCategoryCovers();
  const descs = [
    '空间设计与品牌体验',
    '产品设计与工业创新',
    '数字体验与交互设计',
    '品牌策略与咨询服务',
  ];

  grid.innerHTML = categories.map((name, i) => `
    <div class="category-card" onclick="location.href='category.html?cat=${i}'">
      <div class="category-card-img" style="background-image:url('${covers[i]}')"></div>
      <div class="category-card-overlay">
        <div class="category-number">0${i + 1}</div>
        <h3>${name}</h3>
        <p>${descs[i]}</p>
      </div>
      <div class="category-arrow">→</div>
    </div>
  `).join('');
}

// ---------- 渲染首页横向滚动作品 ----------
async function renderFeaturedWork() {
  const track = document.querySelector('.work-scroll-track');
  if (!track) return;

  const projects = await loadProjects();
  const html = projects.map(p => `
    <div class="work-card" onclick="location.href='detail.html?id=${p.id}'">
      <div class="work-card-img"><img src="${p.cover}" alt="${p.title}" loading="lazy"></div>
      <h3>${p.title}</h3>
      <p>${p.subtitle || ''}</p>
    </div>
  `).join('');
  // 复制两份实现无缝滚动
  track.innerHTML = html + html;
}

// ---------- 站点设置 ----------
const DEFAULT_SITE_SETTINGS = {
  site_name: '设计工作室',
  logo_text: 'STUDIO',
  description: '专注于空间设计、产品设计、数字体验与策略咨询的全链路设计工作室。',
  email: 'hello@studio.com',
  phone: '+86 20 XXXX XXXX',
  address: '广州市天河区 XX 路 XX 号创意园 X 栋',
  hours: '周一至周五 9:00 - 18:00',
  copyright: '© 2024 STUDIO. All rights reserved.',
  icp: '',
  about_intro: '',
  timeline: ''
};

async function loadSiteSettings() {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data } = await sb.from('site_config').select('value').eq('key', 'site_settings').single();
      return { ...DEFAULT_SITE_SETTINGS, ...(data?.value || {}) };
    } catch (e) {
      return DEFAULT_SITE_SETTINGS;
    }
  } else {
    return { ...DEFAULT_SITE_SETTINGS, ...(JSON.parse(localStorage.getItem('siteSettings') || '{}')) };
  }
}

function applySiteSettings(settings) {
  // Logo 文字
  document.querySelectorAll('.logo').forEach(el => {
    el.innerHTML = `${settings.logo_text}<span>.</span>`;
  });

  // 网站标题
  if (settings.site_name) {
    const currentTitle = document.title;
    if (currentTitle.includes('—')) {
      document.title = currentTitle.replace(/^[^—]+/, settings.site_name);
    } else {
      document.title = settings.site_name;
    }
  }

  // 网站描述
  if (settings.description) {
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', settings.description);
    }
  }

  // 联系方式
  const emailEl = document.getElementById('contactEmail');
  const phoneEl = document.getElementById('contactPhone');
  const addressEl = document.getElementById('contactAddress');
  const hoursEl = document.getElementById('contactHours');
  if (emailEl) emailEl.textContent = settings.email;
  if (phoneEl) phoneEl.textContent = settings.phone;
  if (addressEl) addressEl.textContent = settings.address;
  if (hoursEl) hoursEl.textContent = settings.hours;

  // 页脚版权和备案号
  const copyrightEl = document.getElementById('footerCopyright');
  const icpEl = document.getElementById('footerICP');
  if (copyrightEl) copyrightEl.textContent = settings.copyright;
  if (icpEl) {
    icpEl.textContent = settings.icp || '';
    if (!settings.icp) icpEl.style.display = 'none';
  }

  // 关于我们介绍
  const aboutIntroEl = document.getElementById('aboutIntro');
  if (aboutIntroEl && settings.about_intro) {
    aboutIntroEl.innerHTML = settings.about_intro;
  }

  // 关于我们发展历程
  const timelineEl = document.getElementById('aboutTimeline');
  if (timelineEl && settings.timeline) {
    const lines = settings.timeline.split('\n').filter(l => l.trim());
    timelineEl.innerHTML = lines.map(line => {
      const [year, ...rest] = line.split('|');
      const content = rest.join('|');
      return `
        <div class="timeline-item">
          <div class="timeline-year">${year.trim()}</div>
          <div class="timeline-content">${content.trim()}</div>
        </div>
      `;
    }).join('');
  }
}

// ---------- 页面初始化 ----------
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();

  // 加载并应用站点设置
  const settings = await loadSiteSettings();
  applySiteSettings(settings);

  renderHero();
  renderCategories();
  renderFeaturedWork();

  // 初始化粒子背景（如果页面有）
  if (document.getElementById('particles-canvas')) {
    initParticles('particles-canvas');
  }
});
