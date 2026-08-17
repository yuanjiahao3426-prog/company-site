// ============================================
// 作品详情页逻辑 —— 公众号图文风格
// ============================================

function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function renderProjectDetail() {
  const id = getUrlParam('id');
  if (!id) {
    document.getElementById('projectTitle').textContent = '未找到作品';
    return;
  }

  // 加载当前作品
  const project = await loadProjectById(id);
  if (!project) {
    document.getElementById('projectTitle').textContent = '作品不存在';
    return;
  }

  // 设置封面
  const hero = document.getElementById('projectHero');
  hero.style.backgroundImage = `url('${project.cover}')`;

  // 设置标题
  document.getElementById('projectTitle').textContent = project.title;
  document.title = `${project.title} — 设计工作室`;

  // 设置元信息
  const categories = await loadCategories();
  const catName = project.category_index !== undefined
    ? categories[project.category_index] || ''
    : '';

  const meta = document.getElementById('projectMeta');
  meta.innerHTML = `
    ${project.client ? `<span><strong>客户</strong>${project.client}</span>` : ''}
    ${catName ? `<span><strong>分类</strong>${catName}</span>` : ''}
    ${project.year ? `<span><strong>年份</strong>${project.year}</span>` : ''}
  `;

  // 渲染正文（支持 HTML 富文本）
  const body = document.getElementById('projectBody');
  if (project.content) {
    body.innerHTML = project.content;
  } else {
    body.innerHTML = `
      <p>${project.description || project.subtitle || '暂无详细内容。'}</p>
    `;
  }

  // 加载全部作品，计算上一篇/下一篇
  const allProjects = await loadProjects();
  const currentIndex = allProjects.findIndex(p => p.id == id);

  const prevLink = document.getElementById('prevProject');
  const nextLink = document.getElementById('nextProject');

  if (currentIndex > 0) {
    const prev = allProjects[currentIndex - 1];
    prevLink.href = `detail.html?id=${prev.id}`;
    prevLink.textContent = `← ${prev.title}`;
  } else {
    prevLink.style.visibility = 'hidden';
  }

  if (currentIndex >= 0 && currentIndex < allProjects.length - 1) {
    const next = allProjects[currentIndex + 1];
    nextLink.href = `detail.html?id=${next.id}`;
    nextLink.textContent = `${next.title} →`;
  } else {
    nextLink.style.visibility = 'hidden';
  }
}

document.addEventListener('DOMContentLoaded', renderProjectDetail);
