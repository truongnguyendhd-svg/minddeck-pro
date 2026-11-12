-- ============================================================
-- MINDDECK PRO — MỐC M3 XƯỞNG VIẾT: bảng writing_entries
-- ============================================================
-- CÁCH CHẠY (một lần, ~5 giây):
--   Supabase Dashboard → SQL Editor → New query → dán toàn bộ
--   file này → Run. An toàn chạy lại nhiều lần (idempotent).
--
-- SAU KHI CHẠY: các bài đã chấm của tài khoản ĐĂNG NHẬP tự đồng
-- bộ giữa các thiết bị (chip "Đã đồng bộ đám mây" trong khối
-- "Bài đã viết" của Xưởng Viết). Tài khoản KHÁCH và offline vẫn
-- chạy thuần localStorage như cũ — không phụ thuộc bảng này.
--
-- Mô hình (mục 6.2 tài liệu "Thiết kế thẻ Xưởng Viết" — pattern
-- các bảng hiện có: owner_id uuid, category, prompt_id, content,
-- char_count, score, feedback jsonb, created_at; jlpt, style,
-- srs_loaded là phần mở rộng cho 3 mức chấm + nạp SRS của M3).
-- ============================================================

create table if not exists public.writing_entries (
    id          text primary key,           -- mã bài do client sinh ('w' + timestamp)
    owner_id    uuid not null,              -- auth.users.id
    category    text not null,              -- nikki | tegami | sakubun | free
    prompt_id   text not null default 'free',
    content     text not null default '',   -- bài viết gốc
    char_count  integer not null default 0,
    score       numeric,                    -- điểm tổng 0–10 (null nếu chưa chấm)
    jlpt        text,                       -- N5…N1 (ước lượng của AI)
    style       text,                       -- warm | fair | strict (3 mức chấm M3)
    feedback    jsonb,                      -- JSON phản hồi AI đầy đủ (Bảng 4 tài liệu)
    srs_loaded  integer not null default 0, -- số thẻ lỗi đã nạp vào SRS
    created_at  timestamptz not null default now()
);

-- Tra cứu nhanh theo người dùng, mới nhất trước
create index if not exists writing_entries_owner_created_idx
    on public.writing_entries (owner_id, created_at desc);

-- Bật RLS: mỗi người chỉ thấy / sửa / xoá bài của chính mình
alter table public.writing_entries enable row level security;

drop policy if exists "writing_entries_owner_all" on public.writing_entries;
create policy "writing_entries_owner_all"
    on public.writing_entries
    for all
    to authenticated
    using (auth.uid() = owner_id)
    with check (auth.uid() = owner_id);

-- Xong! Không cần restart gì thêm. Về app: menu ☰ → Luyện viết →
-- Xưởng Viết — chip "Đã đồng bộ đám mây" xuất hiện ở khối "Bài đã viết".
