// ============================================
// 分类作品页逻辑 —— 瀑布流展示
// ============================================

let currentCategory = 'all'; // 'all' 或 0/1/2/3
let allProjects = [];
let displayedCount = 0;
const PAGE_SIZE = 9; // 每次加载数量

// 获取 URL 参数
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// 渲染分类 Tab
async function renderCategoryTabs() {
  const tabsContainer = document.getElementById('categoryTabs');
  if (!tabsContainer) return;

  const categories = await loadCategories();
  const catParam = getUrlParam('cat');

  // 确定当前选中的分类
  if (catParam !== null && !isNaN(parseInt(catParam))) {
    currentCategory = parseInt(catParam);
  }

  let tabsHtml = `<button class="category-tab ${currentCategory === 'all' ? 'active' : ''}" data-cat="all">全部</button>`;
  categories.forEach((name, i) => {
    tabsHtml += `<button class="category-tab ${currentCategory === i ? 'active' : ''}" data-cat="${i}">${name}</button>`;
  });
  tabsContainer.innerHTML = tabsHtml;

  // 绑定点击事件
  tabsContainer.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.cat;
      currentCategory = cat === 'all' ? 'all' : parseInt(cat);

      // 更新 URL（不刷新页面）
      const newUrl = cat === 'all'
        ? window.location.pathname
        : `${window.location.pathname}?cat=${cat}`;
      history.pushState({}, '', newUrl);

      // 更新 active 状态
      tabsContainer.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 重新加载作品
      loadAndRender();
    });
  });
}

// 加载并渲染作品
async function loadAndRender() {
  const masonry = document.getElementById('workMasonry');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (!masonry) return;

  // 加载全部作品
  allProjects = await loadProjects();

  // 筛选
  if (currentCategory !== 'all') {
    allProjects = allProjects.filter(p => p.category_index === currentCategory);
  }

  displayedCount = 0;
  masonry.innerHTML = '';

  if (allProjects.length === 0) {
    masonry.innerHTML = '<p style="text-align:center;color:#999;grid-column:1/-1;">暂无作品</p>';
    loadMoreBtn.style.display = 'none';
    return;
  }

  renderMore();
}

// 渲染更多作品（分页加载）
function renderMore() {
  const masonry = document.getElementById('workMasonry');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (!masonry) return;

  const nextBatch = allProjects.slice(displayedCount, displayedCount + PAGE_SIZE);

  nextBatch.forEach(p => {
    const item = document.createElement('div');
    item.className = 'work-item';
    item.onclick = () => location.href = `detail.html?id=${p.id}`;
    item.innerHTML = `
      <div class="work-item-img">
        <img src="${p.cover}" alt="${p.title}" loading="lazy">
      </div>
      <h3>${p.title}</h3>
      <p>${p.subtitle || ''}</p>
    `;
    masonry.appendChild(item);
  });

  displayedCount += nextBatch.length;

  // 控制加载更多按钮显示
  if (displayedCount < allProjects.length) {
    loadMoreBtn.style.display = 'inline-block';
  } else {
    loadMoreBtn.style.display = 'none';
  }
}

// 页面初始化
document.addEventListener('DOMContentLoaded', async () => {
  await renderCategoryTabs();
  await loadAndRender();

  // 加载更多按钮
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  loadMoreBtn?.addEventListener('click', renderMore);
});

// 浏览器前进后退时重新加载
window.addEventListener('popstate', async () => {
  await renderCategoryTabs();
  await loadAndRender();
});
