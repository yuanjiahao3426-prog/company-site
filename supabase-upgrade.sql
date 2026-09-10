-- ============================================================
-- 朗格官网 · 一键修复 / 升级脚本（可重复执行，不会报错）
-- 解决：
--   1. 后台点保存不更新（RLS 行级安全拦截了匿名写入，报 401 / 42501）
--   2. 作品自由排版需要的 blocks 字段
--   3. 图片直接上传需要的公开存储桶 uploads 及访问策略
-- 用法：Supabase 左侧 SQL Editor → New query →
--      把本文件全部粘贴进去 → 点 Run → 看到 Success 即可
-- ============================================================

-- 1) projects 作品表新增「结构化内容区块」字段 blocks（旧 content 保留兼容）
alter table public.projects add column if not exists blocks jsonb;

-- 2) 四张业务表：开启 RLS，并放行匿名用户的增删改查
--    （网站是纯静态前台 + anon 公开密钥，后台管理靠 admin 密码；
--     必须放开写入，后台点保存才不会被数据库拦截）
do $$
declare t text; pname text;
begin
  foreach t in array array['projects','hero_slides','site_config','contact_messages']
  loop
    if to_regclass('public.'||t) is not null then
      pname := 'anon_all_'||t;
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', pname, t);
      execute format(
        'create policy %I on public.%I for all to anon, authenticated using (true) with check (true)',
        pname, t);
      execute format('grant select,insert,update,delete on public.%I to anon, authenticated', t);
    end if;
  end loop;
end $$;

-- 3) 创建公开图片存储桶 uploads（封面 / 轮播 / 详情图 / Logo 都存这里）
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- 4) 存储桶访问策略：匿名可读、可上传、可改、可删（先删同名保证可重复执行）
drop policy if exists "uploads public read"   on storage.objects;
drop policy if exists "uploads public insert" on storage.objects;
drop policy if exists "uploads public update" on storage.objects;
drop policy if exists "uploads public delete" on storage.objects;

create policy "uploads public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'uploads');
create policy "uploads public insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'uploads');
create policy "uploads public update" on storage.objects
  for update to anon, authenticated using (bucket_id = 'uploads');
create policy "uploads public delete" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'uploads');

-- 完成。看到 Success 后关闭，回网站后台 Ctrl+F5 刷新，重新保存即可。
