// ============================================
// Supabase 配置文件 —— 请替换下面两行密钥
// ============================================
// 第一步：打开 https://supabase.com 注册登录
// 第二步：新建项目，进入项目后点击左侧「Project Settings」→「API」
// 第三步：复制 Project URL 和 anon public key 粘贴到下面

const SUPABASE_URL = "https://xdsxcfsmobgebwcxdebj.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc3hjZnNtb2JnZWJ3Y3hkZWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MDcwNDQsImV4cCI6MjEwMTk4MzA0NH0.iB_CmCIy4bmjtCHHa4r9xW0-O-t4rI2NkvLhybQzOyg";

// 后台管理登录密码（请修改为你自己的密码）
const ADMIN_PASSWORD = "langge123456789";

// 四个作品分类默认名称（可在后台修改）
const DEFAULT_CATEGORIES = ["一", "二", "三", "四"];

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
