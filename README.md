# 设计工作室公司官网（零基础保姆级教程）

> 一个黑白极简风格的设计工作室官网，支持作品管理、分类展示、后台内容编辑，无需编程基础即可部署和使用。
> 技术栈：纯 HTML + CSS + JavaScript + Supabase（数据库）+ Vercel（免费部署）

---

## 功能特性

- 首页 **16:9 大图轮播**（自动轮播，鼠标悬停暂停，支持 GIF 动图）
- **四大作品分类**图文展示，点击进入分类瀑布流
- 作品详情页（**公众号图文风格**，支持富文本 HTML）
- 精选作品横向自动滚动展示
- 客户 Logo 墙
- CTA **动态渐变弥散粒子**背景
- 关于我们、联系我们页面
- 联系表单提交（数据存入 Supabase）
- **后台管理系统**（密码登录，管理作品/轮播/分类/留言）
- 响应式设计，适配电脑/平板/手机

---

## 项目文件结构

```
company-site/
├── index.html          # 首页（16:9轮播 + 四分类图文 + 精选作品 + 粒子CTA）
├── category.html       # 分类作品列表页（瀑布流 + Tab切换）
├── detail.html         # 作品详情页（公众号图文风格）
├── about.html          # 关于我们
├── contact.html        # 联系我们（表单）
├── admin.html          # 后台管理（密码登录）
├── css/
│   └── style.css       # 全部样式
├── js/
│   ├── config.js       # ⚠️ 配置文件（需修改密钥和密码）
│   ├── main.js         # 通用脚本 + 示例数据
│   ├── particles.js    # 动态渐变弥散粒子动画
│   ├── category.js     # 分类页逻辑
│   ├── detail.js       # 详情页逻辑
│   ├── contact.js      # 联系表单
│   └── admin.js        # 后台管理逻辑
└── README.md           # 本教程
```

---

## 第一步：本地预览（先看看效果）

1. 把整个 `company-site` 文件夹下载到电脑
2. 双击打开 `index.html`，即可在浏览器中预览网站
3. 此时使用的是内置示例数据，无需配置任何东西

> 提示：未配置 Supabase 时，网站也能正常展示示例数据，后台修改会保存在浏览器本地。配置 Supabase 后数据才会云端同步。

---

## 第二步：配置 Supabase（数据库）

Supabase 是免费的后端服务，用来存储作品数据、轮播图、联系表单留言。

### 2.1 注册账号

1. 打开 https://supabase.com
2. 点击右上角「Start your project」
3. 用 GitHub 账号或邮箱注册登录（免费）

### 2.2 创建项目

1. 登录后点击「New project」
2. 填写：
   - **Name**：随便填，比如 `my-company-site`
   - **Database Password**：设置一个密码（记下来）
   - **Region**：选 `Southeast Asia (Singapore)`（离中国近，速度快）
   - **Pricing**：选免费版 Free
3. 点击「Create new project」，等待 1-2 分钟创建完成

### 2.3 获取密钥

1. 项目创建好后，点击左侧菜单最下面的「Project Settings」（齿轮图标）
2. 点击「API」
3. 你会看到两个关键信息：
   - **Project URL**：类似 `https://xxxxxx.supabase.co`
   - **anon public**：一长串字符（public 的密钥，可以公开）
4. **复制这两个值，备用**

### 2.4 填写到代码中

1. 用记事本或 VS Code 打开 `js/config.js`
2. 把第 8 行的 `https://你的项目URL.supabase.co` 替换为你的 Project URL
3. 把第 9 行的 `你的anon公钥` 替换为你的 anon public key
4. 修改第 12 行的管理员密码 `admin123` 为你自己的密码
5. 保存文件

### 2.5 创建数据表（SQL 执行）

1. 在 Supabase 后台，点击左侧菜单「SQL Editor」
2. 点击「New query」
3. 把下面这段 SQL 全部复制粘贴进去，点击「Run」执行：

```sql
-- 作品表
CREATE TABLE projects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  cover TEXT NOT NULL,
  client TEXT,
  year TEXT,
  category_index INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  content TEXT
);

-- 首页轮播图表
CREATE TABLE hero_slides (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  image TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  caption TEXT,
  sort_order INT DEFAULT 0
);

-- 网站配置表
CREATE TABLE site_config (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- 联系留言表
CREATE TABLE contact_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  category TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认分类
INSERT INTO site_config (key, value)
VALUES ('categories', '["一","二","三","四"]'::jsonb);

-- 开启 RLS（行级安全）
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取作品、轮播、配置
CREATE POLICY "Allow read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow read hero" ON hero_slides FOR SELECT USING (true);
CREATE POLICY "Allow read config" ON site_config FOR SELECT USING (true);

-- 允许所有人提交联系表单
CREATE POLICY "Allow insert messages" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read messages" ON contact_messages FOR SELECT USING (true);
```

> 注意：为了简化，后台管理的写操作权限没有做严格限制。对于小型企业官网，当前配置足够使用。

### 2.6 （可选）开启 Storage 图床

如果你想在 Supabase 中存储图片：
1. 点击左侧「Storage」
2. 点击「New bucket」，名称填 `images`，勾选「Public bucket」
3. 创建后可以上传图片，复制图片 URL 填入后台

> 也可以用免费图床（如 https://sm.ms ）上传图片，复制链接使用，更简单。

---

## 第三步：部署到 Vercel（免费上线）

Vercel 是免费的网站托管平台，部署后你的网站就有公网网址了。

### 3.1 准备工作

1. 注册 GitHub 账号：https://github.com （免费）
2. 注册 Vercel 账号：https://vercel.com （用 GitHub 登录即可）

### 3.2 上传代码到 GitHub

方法一（最简单，不用装 Git）：
1. 登录 GitHub，点击右上角「+」→「New repository」
2. Repository name 填 `company-site`，选 Public，点击「Create repository」
3. 在创建好的页面，点击「uploading an existing file」
4. 把你电脑上 `company-site` 文件夹里的**所有文件和文件夹**拖进去
5. 点击「Commit changes」

### 3.3 导入到 Vercel

1. 登录 Vercel，点击「Add New...」→「Project」
2. 在 Import Git Repository 下面，找到你刚创建的 `company-site`，点击「Import」
3. 配置页面：
   - Framework Preset：选 `Other`
   - Build Command：留空
   - Output Directory：留空
4. 点击「Deploy」
5. 等待 1-2 分钟，部署完成！
6. 你会得到一个网址，类似 `https://company-site-xxxxx.vercel.app`

### 3.4 访问网站

- 前台首页：`https://你的网址.vercel.app`
- 后台管理：`https://你的网址.vercel.app/admin.html`（输入你设置的密码登录）

---

## 第四步：使用后台管理

1. 打开 `你的网址/admin.html`
2. 输入密码登录（默认 `admin123`，已在 config.js 中修改的话用你的密码）
3. 四个管理模块：
   - **作品管理**：新增/编辑/删除作品案例，设置封面、分类、详情图文
   - **首页轮播**：管理首页大图轮播（支持 GIF 动图）
   - **分类设置**：修改四个作品分类的名称（一/二/三/四）
   - **咨询留言**：查看客户通过联系表单提交的留言

### 作品详情内容编辑说明

在「作品管理」→ 编辑作品 →「详情内容」框中，支持 HTML 标签，可以实现类似公众号的图文排版：

```html
<h2>大标题</h2>
<p>普通段落文字</p>
<h3>小标题</h3>
<img src="https://图片地址">
<blockquote>引用文字</blockquote>
<ul><li>无序列表项</li></ul>
<ol><li>有序列表项</li></ol>
```

---

## 第五步：自定义修改

### 修改公司名称和 Logo

- 打开每个 HTML 文件，搜索 `STUDIO` 替换为你的公司名
- Logo 文字在 `<div class="logo">STUDIO<span>.</span></div>`，始终为黑色

### 修改主色调

- 打开 `css/style.css`，找到 `--primary: #e63946;`
- 改成你想要的颜色

### 修改联系方式

- 打开 `contact.html`，修改邮箱、电话、地址
- 打开每个 HTML 文件的页脚部分，修改版权和备案号

### 修改首页文案

- 首页轮播图文案在后台「首页轮播」中管理
- 关于我们内容在 `about.html` 中修改

---

## 第六步：绑定自己的域名（可选）

如果你有自己的域名（如 www.yourcompany.com）：
1. 在 Vercel 项目页面，点击「Settings」→「Domains」
2. 输入你的域名，点击「Add」
3. 按照提示去域名服务商（如阿里云、腾讯云）修改 DNS 解析
4. 等待生效（几分钟到几小时）

---

## 常见问题

**Q：不配置 Supabase 可以用吗？**
A：可以。网站会使用内置示例数据，后台修改保存在浏览器本地。但换电脑或清缓存后数据会丢失，建议配置 Supabase。

**Q：后台密码忘了怎么办？**
A：打开 `js/config.js`，修改 `ADMIN_PASSWORD` 的值，重新上传部署即可。

**Q：图片上传到哪里？**
A：推荐用免费图床 https://sm.ms ，上传后复制图片链接，粘贴到后台的封面图 URL 栏。也可以用 Supabase Storage。

**Q：联系表单提交后在哪里看？**
A：登录后台 →「咨询留言」，可以看到所有提交记录。配置了 Supabase 才会云端保存。

**Q：怎么修改轮播速度？**
A：打开 `js/main.js`，搜索 `6000`（毫秒），改成你想要的间隔时间。

**Q：轮播图支持 GIF 吗？**
A：支持。直接把 GIF 图片的 URL 填入后台「首页轮播」的图片地址即可。

**Q：手机上显示不正常？**
A：本网站已做响应式适配，手机/平板/电脑都能正常显示。如果有问题请检查浏览器是否为最新版。

---

## 技术支持

如果在部署过程中遇到问题，可以：
1. 检查每一步是否严格按照教程操作
2. 确认 Supabase 的 URL 和 anon key 复制正确（没有多余空格）
3. 确认 SQL 语句全部执行成功
4. 浏览器按 F12 打开控制台，查看是否有红色报错信息

---

**祝你的网站顺利上线！**
