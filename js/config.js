// ============================================
// Supabase 配置文件 —— 请替换下面两行密钥
// ============================================
// 第一步：打开 https://supabase.com 注册登录
// 第二步：新建项目，进入项目后点击左侧「Project Settings」→「API」
// 第三步：复制 Project URL 和 anon public key 粘贴到下面

const SUPABASE_URL = "https://xdsxcfsmobgebwcxdebj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc3hjZnNtb2JnZWJ3Y3hkZWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MDcwNDQsImV4cCI6MjEwMTk4MzA0NH0.iB_CmCIy4bmjtCHHa4r9xW0-O-t4rI2NkvLhybQzOyg";

// 后台管理登录密码（请修改为你自己的密码）
const ADMIN_PASSWORD = "langge123456789";

// 四个作品分类默认名称（可在后台修改）
const DEFAULT_CATEGORIES = ["一", "二", "三", "四"];

// Supabase Storage 存储桶名称（需先在 Supabase 后台创建同名公开存储桶，见部署说明）
const STORAGE_BUCKET = "uploads";

// 初始化 Supabase 客户端
let supabaseClient = null;

function initSupabase() {
  if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
  }
  return null;
}

function getSupabase() {
  if (!supabaseClient) initSupabase();
  return supabaseClient;
}

// 上传单个图片文件到 Supabase Storage，返回可公开访问的 URL
// folder: 存放子目录，如 projects / hero / logo
async function uploadImageFile(file, folder) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase 未配置，无法上传");
  if (!file) throw new Error("文件为空");

  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowed.indexOf(file.type) === -1) {
    throw new Error("仅支持 JPG、PNG、GIF、WEBP 格式：" + file.name);
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("单张图片不能超过 8MB：" + file.name);
  }

  const extMap = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp" };
  const ext = extMap[file.type] || "jpg";
  const safeFolder = folder || "misc";
  const rand = Math.random().toString(36).slice(2, 8);
  const path = safeFolder + "/" + Date.now() + "-" + rand + "." + ext;

  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type
  });
  if (error) throw error;

  const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
