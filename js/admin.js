// ============================================
// 后台管理脚本
// ============================================

let isAdmin = false;
let currentTab = 'projects';

// ---------- 登录/登出 ----------
function adminLogin() {
  const pwd = document.getElementById('adminPassword').value;
  if (pwd === ADMIN_PASSWORD) {
    isAdmin = true;
    sessionStorage.setItem('adminLoggedIn', 'true');
    showAdminPanel();
  } else {
    alert('密码错误，请重试');
  }
}

function adminLogout() {
  isAdmin = false;
  sessionStorage.removeItem('adminLoggedIn');
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
}

function showAdminPanel() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  loadAllData();
}

// 回车登录
document.addEventListener('DOMContentLoaded', () => {
  // 初始化图片上传器（容器在 DOM 中一直存在，只是面板隐藏）
  initAdminUploaders();

  if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    isAdmin = true;
    showAdminPanel();
  }
  const pwdInput = document.getElementById('adminPassword');
  if (pwdInput) {
    pwdInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') adminLogin();
    });
  }
});

// ---------- 切换标签 ----------
function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.admin-sidebar button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['projects', 'hero', 'categories', 'settings', 'messages'].forEach(t => {
    document.getElementById('tab-' + t).style.display = t === tab ? 'block' : 'none';
  });
}

// ---------- 加载所有数据 ----------
async function loadAllData() {
  await loadProjectsTable();
  await loadHeroTable();
  await loadCategoryInputs();
  await loadSettingsForm();
  await loadMessagesTable();
}

// ========== 作品管理 ==========
async function loadProjectsTable() {
  const tbody = document.getElementById('projectsTable');
  const sb = getSupabase();
  const categories = await loadCategories();
  let projects;

  if (sb) {
    const { data, error } = await sb.from('projects').select('*').order('sort_order', { ascending: true });
    projects = data || [];
  } else {
    projects = JSON.parse(localStorage.getItem('adminProjects') || 'null') || getSampleProjects();
  }

  tbody.innerHTML = projects.map(p => {
    const catName = p.category_index !== undefined ? (categories[p.category_index] || '-') : '-';
    return `
    <tr>
      <td><img src="${p.cover}" style="width:60px;height:40px;object-fit:cover;border-radius:4px;"></td>
      <td>${p.title}</td>
      <td>${catName}</td>
      <td>${p.client || '-'}</td>
      <td>${p.year || '-'}</td>
      <td>${p.sort_order || 0}</td>
      <td class="actions">
        <button class="btn-edit" onclick='editProject(${JSON.stringify(p).replace(/'/g, "&#39;")})'>编辑</button>
        <button class="btn-delete" onclick="deleteProject(${p.id})">删除</button>
      </td>
    </tr>
  `}).join('');
}

// ---------- 图片上传器实例 ----------
let coverUploader = null;   // 作品封面（单图）
let heroUploader = null;    // 轮播大图（单图）
let logoUploader = null;    // Logo（单图）
let uploadersInited = false;
// 作品内容区块
let projectBlocks = [];
let blockUploaders = {};    // blockId -> ImageUploader

function initAdminUploaders() {
  if (uploadersInited || typeof ImageUploader === 'undefined') return;
  coverUploader = new ImageUploader(document.getElementById('projectCoverUploader'), { multiple: false, folder: 'projects' });
  heroUploader = new ImageUploader(document.getElementById('heroImageUploader'), { multiple: false, folder: 'hero' });
  logoUploader = new ImageUploader(document.getElementById('settingLogoUploader'), { multiple: false, folder: 'logo' });
  uploadersInited = true;
}

// ---------- 工具：转义 ----------
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escapeAttr(str) { return escapeHtml(str); }

function genBlockId() { return 'b' + Date.now() + Math.random().toString(36).slice(2, 6); }
function newBlock(level) { return { id: genBlockId(), level: level || 'h2', heading: '', text: '', images: [] }; }

// 把已有作品解析成区块（优先结构化 blocks，兼容旧 HTML content）
function parseProjectBlocks(p) {
  if (Array.isArray(p.blocks) && p.blocks.length) {
    return p.blocks.map(b => ({
      id: genBlockId(),
      level: b.level || 'h2',
      heading: b.heading || '',
      text: b.text || '',
      images: Array.isArray(b.images) ? b.images : []
    }));
  }
  if (p.content && String(p.content).trim()) {
    return [{ id: genBlockId(), level: 'html', heading: '', text: p.content, images: [] }];
  }
  return [newBlock('h2'), newBlock('h2')];
}

function openProjectModal() {
  document.getElementById('projectModalTitle').textContent = '新增作品';
  document.getElementById('projectId').value = '';
  document.getElementById('projectTitle').value = '';
  document.getElementById('projectSubtitle').value = '';
  document.getElementById('projectClient').value = '';
  document.getElementById('projectYear').value = '';
  document.getElementById('projectCategory').value = '0';
  document.getElementById('projectSort').value = '0';
  coverUploader.setValue([]);
  projectBlocks = [newBlock('h2'), newBlock('h2')];
  blockUploaders = {};
  renderBlocksEditor();
  document.getElementById('projectModal').classList.add('active');
}

function editProject(p) {
  document.getElementById('projectModalTitle').textContent = '编辑作品';
  document.getElementById('projectId').value = p.id;
  document.getElementById('projectTitle').value = p.title || '';
  document.getElementById('projectSubtitle').value = p.subtitle || '';
  coverUploader.setValue(p.cover ? [p.cover] : []);
  document.getElementById('projectClient').value = p.client || '';
  document.getElementById('projectYear').value = p.year || '';
  document.getElementById('projectCategory').value = p.category_index !== undefined ? p.category_index : '0';
  document.getElementById('projectSort').value = p.sort_order || 0;
  projectBlocks = parseProjectBlocks(p);
  blockUploaders = {};
  renderBlocksEditor();
  document.getElementById('projectModal').classList.add('active');
}

// ---------- 区块编辑器 ----------
function blockHTML(b, idx) {
  const sel = (v) => b.level === v ? 'selected' : '';
  return `
    <div class="block-item" data-block-id="${b.id}">
      <div class="block-head">
        <span class="block-index">区块 ${idx + 1}</span>
        <select class="blk-level">
          <option value="h2" ${sel('h2')}>二级标题（项目背景 / 设计策略 等）</option>
          <option value="h1" ${sel('h1')}>一级标题</option>
          <option value="h3" ${sel('h3')}>三级标题</option>
          <option value="none" ${sel('none')}>无标题（只放正文或图片）</option>
          <option value="html" ${sel('html')}>旧版 HTML（兼容老内容）</option>
        </select>
        <div class="block-tools">
          <button type="button" onclick="moveBlock('${b.id}',-1)">上移</button>
          <button type="button" onclick="moveBlock('${b.id}',1)">下移</button>
          <button type="button" class="block-del" onclick="removeBlock('${b.id}')">删除</button>
        </div>
      </div>
      <input type="text" class="blk-heading" placeholder="标题文字，如：项目背景 / 设计策略 / 空间亮点 / 空间效果（可留空）" value="${escapeAttr(b.heading)}">
      <textarea class="blk-text" rows="3" placeholder="正文内容，按回车可分段；不需要文字就留空">${escapeAttr(b.text)}</textarea>
      <div class="blk-images"></div>
    </div>
  `;
}

function renderBlocksEditor() {
  const container = document.getElementById('blocksEditor');
  if (!container) return;
  blockUploaders = {};
  if (!projectBlocks.length) {
    container.innerHTML = '<p class="blocks-empty">还没有内容区块，点下方「添加内容区块」开始排版</p>';
    return;
  }
  container.innerHTML = projectBlocks.map((b, idx) => blockHTML(b, idx)).join('');
  projectBlocks.forEach(b => {
    const el = container.querySelector('[data-block-id="' + b.id + '"]');
    if (!el) return;
    el.querySelector('.blk-level').onchange = e => { b.level = e.target.value; };
    el.querySelector('.blk-heading').oninput = e => { b.heading = e.target.value; };
    el.querySelector('.blk-text').oninput = e => { b.text = e.target.value; };
    const up = new ImageUploader(el.querySelector('.blk-images'), {
      multiple: true, max: 20, folder: 'projects', value: b.images,
      onChange: urls => { b.images = urls; }
    });
    blockUploaders[b.id] = up;
  });
}

function addBlock() {
  projectBlocks.push(newBlock('h2'));
  renderBlocksEditor();
  // 滚动到最新区块
  const container = document.getElementById('blocksEditor');
  container.lastElementChild && container.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function removeBlock(id) {
  projectBlocks = projectBlocks.filter(b => b.id !== id);
  delete blockUploaders[id];
  renderBlocksEditor();
}

function moveBlock(id, dir) {
  const i = projectBlocks.findIndex(b => b.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= projectBlocks.length) return;
  const tmp = projectBlocks[i]; projectBlocks[i] = projectBlocks[j]; projectBlocks[j] = tmp;
  renderBlocksEditor();
}

function someBlockUploaderBusy() {
  return Object.values(blockUploaders).some(u => u && u.isBusy && u.isBusy());
}

// 收集有效区块（标题/正文/图片全空的自动丢弃）
function collectBlocks() {
  return projectBlocks.map(b => ({
    level: b.level || 'h2',
    heading: (b.heading || '').trim(),
    text: (b.text || '').trim(),
    images: (blockUploaders[b.id] ? blockUploaders[b.id].getValue() : b.images) || []
  })).filter(b => b.heading || b.text || (b.images && b.images.length));
}

// 把区块渲染成 HTML（同时存一份到 content，兼容旧逻辑与 SEO）
function blocksToHtml(blocks) {
  return blocks.map(b => {
    if (b.level === 'html') return b.text || '';
    let h = '';
    if (b.heading && b.level && b.level !== 'none') {
      h += '<' + b.level + '>' + escapeHtml(b.heading) + '</' + b.level + '>';
    }
    if (b.text) {
      h += b.text.split(/\n+/).filter(Boolean).map(t => '<p>' + escapeHtml(t) + '</p>').join('');
    }
    if (b.images && b.images.length) {
      h += '<div class="pb-gallery count-' + b.images.length + '">' +
        b.images.map(s => '<figure><img src="' + s + '" alt="" loading="lazy"></figure>').join('') +
        '</div>';
    }
    return h;
  }).join('');
}

async function saveProject() {
  const id = document.getElementById('projectId').value;

  if (coverUploader.isBusy() || someBlockUploaderBusy()) {
    alert('还有图片正在上传，请等待上传完成（缩略图正常显示）后再保存');
    return;
  }

  const blocks = collectBlocks();
  const coverArr = coverUploader.getValue();

  const data = {
    title: document.getElementById('projectTitle').value.trim(),
    subtitle: document.getElementById('projectSubtitle').value.trim(),
    cover: coverArr[0] || '',
    client: document.getElementById('projectClient').value.trim(),
    year: document.getElementById('projectYear').value.trim(),
    category_index: parseInt(document.getElementById('projectCategory').value) || 0,
    sort_order: parseInt(document.getElementById('projectSort').value) || 0,
    blocks: blocks,
    content: blocksToHtml(blocks)
  };

  if (!data.title) { alert('请填写作品标题（项目名称）'); return; }
  if (!data.cover) { alert('请上传作品封面图'); return; }

  const sb = getSupabase();
  if (sb) {
    if (id) {
      const { error } = await sb.from('projects').update(data).eq('id', id);
      if (error) { alert('保存失败：' + error.message); return; }
    } else {
      const { error } = await sb.from('projects').insert([data]);
      if (error) { alert('新增失败：' + error.message + '\n如果提示 blocks 字段不存在，请先执行部署说明里的数据库升级 SQL'); return; }
    }
  } else {
    let projects = JSON.parse(localStorage.getItem('adminProjects') || 'null') || getSampleProjects();
    if (id) {
      const idx = projects.findIndex(p => String(p.id) === String(id));
      if (idx > -1) projects[idx] = { ...projects[idx], ...data };
    } else {
      data.id = Date.now();
      projects.push(data);
    }
    localStorage.setItem('adminProjects', JSON.stringify(projects));
  }

  closeModal('projectModal');
  await loadProjectsTable();
}

async function deleteProject(id) {
  if (!confirm('确定删除这个作品吗？')) return;
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('projects').delete().eq('id', id);
    if (error) { alert('删除失败：' + error.message); return; }
  } else {
    let projects = JSON.parse(localStorage.getItem('adminProjects') || 'null') || getSampleProjects();
    projects = projects.filter(p => String(p.id) !== String(id));
    localStorage.setItem('adminProjects', JSON.stringify(projects));
  }
  await loadProjectsTable();
}

// ========== 首页轮播管理 ==========
async function loadHeroTable() {
  const tbody = document.getElementById('heroTable');
  const sb = getSupabase();
  let slides;

  if (sb) {
    const { data } = await sb.from('hero_slides').select('*').order('sort_order', { ascending: true });
    slides = data || [];
  } else {
    slides = JSON.parse(localStorage.getItem('adminHero') || 'null') || getSampleHeroSlides();
  }

  tbody.innerHTML = slides.map(s => `
    <tr>
      <td><img src="${s.image}" style="width:80px;height:45px;object-fit:cover;border-radius:4px;"></td>
      <td>${s.title}</td>
      <td>${s.subtitle || '-'}</td>
      <td>${s.sort_order || 0}</td>
      <td class="actions">
        <button class="btn-edit" onclick='editHero(${JSON.stringify(s).replace(/'/g, "&#39;")})'>编辑</button>
        <button class="btn-delete" onclick="deleteHero(${s.id})">删除</button>
      </td>
    </tr>
  `).join('');
}

function openHeroModal() {
  document.getElementById('heroModalTitle').textContent = '新增轮播图';
  document.getElementById('heroId').value = '';
  heroUploader.setValue([]);
  document.getElementById('heroTitle').value = '';
  document.getElementById('heroSubtitle').value = '';
  document.getElementById('heroCaption').value = '';
  document.getElementById('heroSort').value = '0';
  document.getElementById('heroModal').classList.add('active');
}

function editHero(s) {
  document.getElementById('heroModalTitle').textContent = '编辑轮播图';
  document.getElementById('heroId').value = s.id;
  heroUploader.setValue(s.image ? [s.image] : []);
  document.getElementById('heroTitle').value = s.title || '';
  document.getElementById('heroSubtitle').value = s.subtitle || '';
  document.getElementById('heroCaption').value = s.caption || '';
  document.getElementById('heroSort').value = s.sort_order || 0;
  document.getElementById('heroModal').classList.add('active');
}

async function saveHero() {
  const id = document.getElementById('heroId').value;

  if (heroUploader.isBusy()) {
    alert('图片还在上传中，请稍候');
    return;
  }
  const imgArr = heroUploader.getValue();

  const data = {
    image: imgArr[0] || '',
    title: document.getElementById('heroTitle').value,
    subtitle: document.getElementById('heroSubtitle').value,
    caption: document.getElementById('heroCaption').value,
    sort_order: parseInt(document.getElementById('heroSort').value) || 0,
  };

  if (!data.image || !data.title) {
    alert('请上传轮播图片并填写标题');
    return;
  }

  const sb = getSupabase();
  if (sb) {
    const resp = id
      ? await sb.from('hero_slides').update(data).eq('id', id)
      : await sb.from('hero_slides').insert([data]);
    if (resp.error) { alert('保存失败：' + resp.error.message + '\n（若提示权限/RLS，请执行数据库修复 SQL）'); return; }
  } else {
    let slides = JSON.parse(localStorage.getItem('adminHero') || 'null') || getSampleHeroSlides();
    if (id) {
      const idx = slides.findIndex(s => String(s.id) === String(id));
      if (idx > -1) slides[idx] = { ...slides[idx], ...data };
    } else {
      data.id = Date.now();
      slides.push(data);
    }
    localStorage.setItem('adminHero', JSON.stringify(slides));
  }

  closeModal('heroModal');
  await loadHeroTable();
}

async function deleteHero(id) {
  if (!confirm('确定删除这张轮播图吗？')) return;
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('hero_slides').delete().eq('id', id);
    if (error) { alert('删除失败：' + error.message); return; }
  } else {
    let slides = JSON.parse(localStorage.getItem('adminHero') || 'null') || getSampleHeroSlides();
    slides = slides.filter(s => String(s.id) !== String(id));
    localStorage.setItem('adminHero', JSON.stringify(slides));
  }
  await loadHeroTable();
}

// ========== 分类设置 ==========
async function loadCategoryInputs() {
  const container = document.getElementById('categoryInputs');
  const categories = await loadCategories();
  container.innerHTML = categories.map((cat, i) => `
    <div class="form-group" style="margin:0;">
      <label>分类 ${i + 1}</label>
      <input type="text" class="category-input" value="${cat}" data-index="${i}">
    </div>
  `).join('');
}

async function saveCategories() {
  const inputs = document.querySelectorAll('.category-input');
  const categories = Array.from(inputs).map(i => i.value.trim()).filter(Boolean);

  if (categories.length !== 4) {
    alert('请填写 4 个分类名称');
    return;
  }

  const sb = getSupabase();
  if (sb) {
    const { data: existing } = await sb.from('site_config').select('key').eq('key', 'categories').maybeSingle();
    let err;
    if (existing) {
      ({ error: err } = await sb.from('site_config').update({ value: categories }).eq('key', 'categories'));
    } else {
      ({ error: err } = await sb.from('site_config').insert([{ key: 'categories', value: categories }]));
    }
    if (err) { alert('分类保存失败：' + err.message + '\n（请执行数据库修复 SQL 打开写入权限）'); return; }
  } else {
    localStorage.setItem('adminCategories', JSON.stringify(categories));
  }

  alert('分类保存成功！');
}

// ========== 咨询留言 ==========
async function loadMessagesTable() {
  const tbody = document.getElementById('messagesTable');
  const sb = getSupabase();
  const categories = await loadCategories();
  let messages;

  if (sb) {
    const { data } = await sb.from('contact_messages').select('*').order('created_at', { ascending: false });
    messages = data || [];
  } else {
    messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
  }

  if (!messages.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;padding:40px;">暂无留言</td></tr>';
    return;
  }

  tbody.innerHTML = messages.map(m => {
    const catLabel = m.category !== undefined && m.category !== ''
      ? (m.category === 'other' ? '其他' : (categories[parseInt(m.category)] || m.category))
      : '-';
    return `
    <tr>
      <td>${m.name || '-'}</td>
      <td>${m.company || '-'}</td>
      <td>${m.email || '-'}</td>
      <td>${m.phone || '-'}</td>
      <td>${catLabel}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${m.message || ''}">${m.message || '-'}</td>
      <td>${m.created_at ? new Date(m.created_at).toLocaleString('zh-CN') : '-'}</td>
    </tr>
  `}).join('');
}

// ========== 站点设置 ==========
// 注意：DEFAULT_SITE_SETTINGS 统一定义在 main.js，此处不再重复声明，否则会导致整个 admin.js 崩溃
async function loadSettingsForm() {
  const sb = getSupabase();
  let settings;

  if (sb) {
    const { data } = await sb.from('site_config').select('value').eq('key', 'site_settings').maybeSingle();
    settings = data?.value || DEFAULT_SITE_SETTINGS;
  } else {
    settings = JSON.parse(localStorage.getItem('siteSettings') || 'null') || DEFAULT_SITE_SETTINGS;
  }

  const val = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };

  setVal('settingSiteName', settings.site_name);
  if (logoUploader) logoUploader.setValue(settings.logo_image ? [settings.logo_image] : []);
  setVal('settingLogoText', settings.logo_text);
  setVal('settingDescription', settings.description);
  setVal('settingEmail', settings.email);
  setVal('settingPhone', settings.phone);
  setVal('settingAddress', settings.address);
  setVal('settingHours', settings.hours);
  setVal('settingCopyright', settings.copyright);
  setVal('settingICP', settings.icp);
  setVal('settingAboutIntro', settings.about_intro);
  setVal('settingTimeline', settings.timeline);
  // 新增全站文案
  setVal('settingFooterAbout', settings.footer_about);
  setVal('settingSocialWechat', settings.social_wechat);
  setVal('settingSocialXhs', settings.social_xhs);
  setVal('settingClientsLabel', settings.clients_label);
  setVal('settingClientsTitle', settings.clients_title);
  setVal('settingHomeCtaTitle', settings.home_cta_title);
  setVal('settingHomeCtaSubtitle', settings.home_cta_subtitle);
  setVal('settingWorkTitle', settings.work_title);
  setVal('settingWorkSubtitle', settings.work_subtitle);
  setVal('settingAboutCtaTitle', settings.about_cta_title);
  setVal('settingAboutCtaSubtitle', settings.about_cta_subtitle);
  setVal('settingContactLabel', settings.contact_label);
  setVal('settingContactTitle', settings.contact_title);
  setVal('settingContactSubtitle', settings.contact_subtitle);
  // 客户列表
  renderClientsEditor(Array.isArray(settings.clients) ? settings.clients : []);
}

// ---------- 合作客户动态行 ----------
function renderClientsEditor(list) {
  const box = document.getElementById('clientsEditor');
  if (!box) return;
  const items = (list && list.length ? list : ['']);
  box.innerHTML = items.map((c, i) => `
    <div style="display:flex;gap:8px;align-items:center;">
      <input type="text" class="client-row" value="${String(c).replace(/"/g, '&quot;')}" placeholder="客户名称 ${i + 1}" style="flex:1;">
      <button type="button" class="btn-delete" onclick="removeClientRow(this)">删除</button>
    </div>`).join('');
}
function addClientRow() {
  const box = document.getElementById('clientsEditor');
  if (!box) return;
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:8px;align-items:center;';
  div.innerHTML = `<input type="text" class="client-row" placeholder="客户名称" style="flex:1;"><button type="button" class="btn-delete">删除</button>`;
  div.querySelector('.btn-delete').onclick = () => div.remove();
  box.appendChild(div);
  div.querySelector('input').focus();
}
function removeClientRow(btn) {
  const box = document.getElementById('clientsEditor');
  btn.parentElement.remove();
  if (!box.querySelectorAll('.client-row').length) addClientRow();
}
function collectClients() {
  return Array.from(document.querySelectorAll('#clientsEditor .client-row'))
    .map(i => i.value.trim()).filter(Boolean);
}

async function saveSiteSettings() {
  if (logoUploader && logoUploader.isBusy()) {
    alert('Logo 还在上传中，请稍候');
    return;
  }
  const v = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
  const logoArr = logoUploader ? logoUploader.getValue() : [];
  const settings = {
    site_name: v('settingSiteName'),
    logo_image: logoArr[0] || '',
    logo_text: v('settingLogoText'),
    description: v('settingDescription'),
    email: v('settingEmail'),
    phone: v('settingPhone'),
    address: v('settingAddress'),
    hours: v('settingHours'),
    copyright: v('settingCopyright'),
    icp: v('settingICP'),
    about_intro: v('settingAboutIntro'),
    timeline: v('settingTimeline'),
    // 全站文案
    footer_about: v('settingFooterAbout'),
    social_wechat: v('settingSocialWechat'),
    social_xhs: v('settingSocialXhs'),
    clients_label: v('settingClientsLabel'),
    clients_title: v('settingClientsTitle'),
    clients: collectClients(),
    home_cta_title: v('settingHomeCtaTitle'),
    home_cta_subtitle: v('settingHomeCtaSubtitle'),
    work_title: v('settingWorkTitle'),
    work_subtitle: v('settingWorkSubtitle'),
    about_cta_title: v('settingAboutCtaTitle'),
    about_cta_subtitle: v('settingAboutCtaSubtitle'),
    contact_label: v('settingContactLabel'),
    contact_title: v('settingContactTitle'),
    contact_subtitle: v('settingContactSubtitle'),
  };

  const sb = getSupabase();
  if (sb) {
    const { data: existing } = await sb.from('site_config').select('key').eq('key', 'site_settings').maybeSingle();
    let err;
    if (existing) {
      ({ error: err } = await sb.from('site_config').update({ value: settings }).eq('key', 'site_settings'));
    } else {
      ({ error: err } = await sb.from('site_config').insert([{ key: 'site_settings', value: settings }]));
    }
    if (err) { alert('站点设置保存失败：' + err.message + '\n（请执行数据库修复 SQL 打开写入权限）'); return; }
  } else {
    localStorage.setItem('siteSettings', JSON.stringify(settings));
  }

  alert('站点设置保存成功！刷新前台页面即可看到效果。');
}

// ---------- 关闭弹窗 ----------
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// 点击弹窗背景关闭
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});
