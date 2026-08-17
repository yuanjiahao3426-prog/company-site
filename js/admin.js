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
  await loadSiteSettings();
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

function openProjectModal() {
  document.getElementById('projectModalTitle').textContent = '新增作品';
  document.getElementById('projectId').value = '';
  document.getElementById('projectTitle').value = '';
  document.getElementById('projectSubtitle').value = '';
  document.getElementById('projectCover').value = '';
  document.getElementById('projectClient').value = '';
  document.getElementById('projectYear').value = '';
  document.getElementById('projectCategory').value = '0';
  document.getElementById('projectSort').value = '0';
  document.getElementById('projectContent').value = '';
  document.getElementById('projectModal').classList.add('active');
}

function editProject(p) {
  document.getElementById('projectModalTitle').textContent = '编辑作品';
  document.getElementById('projectId').value = p.id;
  document.getElementById('projectTitle').value = p.title || '';
  document.getElementById('projectSubtitle').value = p.subtitle || '';
  document.getElementById('projectCover').value = p.cover || '';
  document.getElementById('projectClient').value = p.client || '';
  document.getElementById('projectYear').value = p.year || '';
  document.getElementById('projectCategory').value = p.category_index !== undefined ? p.category_index : '0';
  document.getElementById('projectSort').value = p.sort_order || 0;
  document.getElementById('projectContent').value = p.content || '';
  document.getElementById('projectModal').classList.add('active');
}

async function saveProject() {
  const id = document.getElementById('projectId').value;
  const data = {
    title: document.getElementById('projectTitle').value,
    subtitle: document.getElementById('projectSubtitle').value,
    cover: document.getElementById('projectCover').value,
    client: document.getElementById('projectClient').value,
    year: document.getElementById('projectYear').value,
    category_index: parseInt(document.getElementById('projectCategory').value) || 0,
    sort_order: parseInt(document.getElementById('projectSort').value) || 0,
    content: document.getElementById('projectContent').value,
  };

  if (!data.title || !data.cover) {
    alert('请填写标题和封面图');
    return;
  }

  const sb = getSupabase();
  if (sb) {
    if (id) {
      await sb.from('projects').update(data).eq('id', id);
    } else {
      await sb.from('projects').insert([data]);
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
    await sb.from('projects').delete().eq('id', id);
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
  document.getElementById('heroImage').value = '';
  document.getElementById('heroTitle').value = '';
  document.getElementById('heroSubtitle').value = '';
  document.getElementById('heroCaption').value = '';
  document.getElementById('heroSort').value = '0';
  document.getElementById('heroModal').classList.add('active');
}

function editHero(s) {
  document.getElementById('heroModalTitle').textContent = '编辑轮播图';
  document.getElementById('heroId').value = s.id;
  document.getElementById('heroImage').value = s.image || '';
  document.getElementById('heroTitle').value = s.title || '';
  document.getElementById('heroSubtitle').value = s.subtitle || '';
  document.getElementById('heroCaption').value = s.caption || '';
  document.getElementById('heroSort').value = s.sort_order || 0;
  document.getElementById('heroModal').classList.add('active');
}

async function saveHero() {
  const id = document.getElementById('heroId').value;
  const data = {
    image: document.getElementById('heroImage').value,
    title: document.getElementById('heroTitle').value,
    subtitle: document.getElementById('heroSubtitle').value,
    caption: document.getElementById('heroCaption').value,
    sort_order: parseInt(document.getElementById('heroSort').value) || 0,
  };

  if (!data.image || !data.title) {
    alert('请填写图片和标题');
    return;
  }

  const sb = getSupabase();
  if (sb) {
    if (id) {
      await sb.from('hero_slides').update(data).eq('id', id);
    } else {
      await sb.from('hero_slides').insert([data]);
    }
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
    await sb.from('hero_slides').delete().eq('id', id);
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
    const { data: existing } = await sb.from('site_config').select('key').eq('key', 'categories').single();
    if (existing) {
      await sb.from('site_config').update({ value: categories }).eq('key', 'categories');
    } else {
      await sb.from('site_config').insert([{ key: 'categories', value: categories }]);
    }
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
  about_intro: '<p>我们是一支由设计师、策略师和工程师组成的跨学科团队。我们相信，好的设计能够改变人与产品、人与空间、人与品牌之间的关系。</p><p>自成立以来，我们已为超过 100 个品牌提供了设计服务，涵盖零售、科技、医疗、教育等多个行业。</p>',
  timeline: '2018|工作室成立\n2020|业务拓展\n2022|数字体验部门成立\n2024|服务超100个品牌'
};

async function loadSiteSettings() {
  const sb = getSupabase();
  let settings;

  if (sb) {
    const { data } = await sb.from('site_config').select('value').eq('key', 'site_settings').single();
    settings = data?.value || DEFAULT_SITE_SETTINGS;
  } else {
    settings = JSON.parse(localStorage.getItem('siteSettings') || 'null') || DEFAULT_SITE_SETTINGS;
  }

  document.getElementById('settingSiteName').value = settings.site_name || '';
  document.getElementById('settingLogoText').value = settings.logo_text || '';
  document.getElementById('settingDescription').value = settings.description || '';
  document.getElementById('settingEmail').value = settings.email || '';
  document.getElementById('settingPhone').value = settings.phone || '';
  document.getElementById('settingAddress').value = settings.address || '';
  document.getElementById('settingHours').value = settings.hours || '';
  document.getElementById('settingCopyright').value = settings.copyright || '';
  document.getElementById('settingICP').value = settings.icp || '';
  document.getElementById('settingAboutIntro').value = settings.about_intro || '';
  document.getElementById('settingTimeline').value = settings.timeline || '';
}

async function saveSiteSettings() {
  const settings = {
    site_name: document.getElementById('settingSiteName').value,
    logo_text: document.getElementById('settingLogoText').value,
    description: document.getElementById('settingDescription').value,
    email: document.getElementById('settingEmail').value,
    phone: document.getElementById('settingPhone').value,
    address: document.getElementById('settingAddress').value,
    hours: document.getElementById('settingHours').value,
    copyright: document.getElementById('settingCopyright').value,
    icp: document.getElementById('settingICP').value,
    about_intro: document.getElementById('settingAboutIntro').value,
    timeline: document.getElementById('settingTimeline').value,
  };

  const sb = getSupabase();
  if (sb) {
    const { data: existing } = await sb.from('site_config').select('key').eq('key', 'site_settings').single();
    if (existing) {
      await sb.from('site_config').update({ value: settings }).eq('key', 'site_settings');
    } else {
      await sb.from('site_config').insert([{ key: 'site_settings', value: settings }]);
    }
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
