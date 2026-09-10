-- ============================================================
-- 朗格官网 · 功能升级 SQL（图片上传 + 作品自由排版）
-- 使用方法：Supabase 后台左侧 SQL Editor → New query →
--           把本文件全部内容粘贴进去 → Run 一次即可，可重复执行
-- ============================================================

-- 1) projects 作品表新增「结构化内容区块」字段 blocks（旧 content 保留兼容）
alter table projects add column if not exists blocks jsonb;

-- 2) 创建公开图片存储桶 uploads（后台上传的封面/轮播/详情图/Logo 都存在这里）
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- 3) 存储桶访问策略（先删同名策略，避免重复执行报错）
drop policy if exists "uploads public read"   on storage.objects;
drop policy if exists "uploads public insert" on storage.objects;
drop policy if exists "uploads public update" on storage.objects;
drop policy if exists "uploads public delete" on storage.objects;

-- 任何人都能读取图片（网站前台要显示）
create policy "uploads public read" on storage.objects
  for select using (bucket_id = 'uploads');

-- 允许匿名上传（后台 admin 页面用 anon key 上传）
create policy "uploads public insert" on storage.objects
  for insert with check (bucket_id = 'uploads');

-- 允许更新与删除（后台管理用）
create policy "uploads public update" on storage.objects
  for update using (bucket_id = 'uploads');
create policy "uploads public delete" on storage.objects
  for delete using (bucket_id = 'uploads');

-- 完成。看到 Success 即可关闭。
