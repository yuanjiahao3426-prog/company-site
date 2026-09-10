// ============================================
// 作品详情页逻辑 —— 公众号图文风格
// ============================================

function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// 文本转义，防止输入内容破坏页面
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// 把结构化区块渲染成公众号图文风格 HTML
function renderProjectBlocks(blocks) {
  return blocks.map(b => {
    // 兼容旧版 HTML 区块
    if (b.level === 'html') return '<div class="pb-legacy">' + (b.text || '') + '</div>';

    let html = '';
    // 标题（一级/二级/三级，none 则无标题）
    if (b.heading && b.level && b.level !== 'none') {
      const tag = (b.level === 'h1' || b.level === 'h2' || b.level === 'h3') ? b.level : 'h2';
      html += '<' + tag + ' class="pb-heading pb-' + tag + '">' + esc(b.heading) + '</' + tag + '>';
    }
    // 正文：按空行/换行分段
    if (b.text) {
      html += b.text.split(/\n+/).filter(Boolean)
        .map(t => '<p class="pb-text">' + esc(t) + '</p>').join('');
    }
    // 图片组：1 张全宽，2 张并排，3 张三列，4 张及以上网格
    const imgs = Array.isArray(b.images) ? b.images.filter(Boolean) : [];
    if (imgs.length) {
      let gridCls = 'pb-gallery';
      if (imgs.length === 1) gridCls += ' one';
      else if (imgs.length === 2) gridCls += ' two';
      else if (imgs.length === 3) gridCls += ' three';
      else gridCls += ' many';
      html += '<div class="' + gridCls + '">' +
        imgs.map(src => '<figure><img src="' + esc(src) + '" alt="" loading="lazy"></figure>').join('') +
        '</div>';
    }
    return '<section class="pb-block">' + html + '</section>';
  }).join('');
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

  // 渲染正文：优先结构化区块 blocks，兼容旧版 HTML content
  const body = document.getElementById('projectBody');
  if (Array.isArray(project.blocks) && project.blocks.length) {
    body.innerHTML = renderProjectBlocks(project.blocks);
  } else if (project.content) {
    body.innerHTML = project.content;
  } else {
    body.innerHTML = `<p>${esc(project.description || project.subtitle || '暂无详细内容。')}</p>`;
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
