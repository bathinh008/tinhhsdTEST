# Hướng dẫn nhanh: Supabase thay Cloudflare

**Bạn chỉ cần làm các bước sau để đưa bản mã nguồn này lên GitHub Pages**:

1. Tạo dự án tại https://supabase.com/dashboard, ghi lại **Project ref**.
2. Vào Supabase **SQL Editor**, mở và chạy toàn bộ file `supabase/migrations/20261124000000_hsd_quotas.sql`.
3. Tạo site tại https://dashboard.hcaptcha.com, cho phép domain `tp.bongbup.online` (hoặc domain bạn đang dùng). Lấy **Site Key** và **Secret Key**.
4. Vào Supabase **Edge Functions → Secrets** và nhập:
   - `OPENAI_API_KEY` = khóa OpenAI của bạn (**bí mật**)
   - `HCAPTCHA_SECRET` = hCaptcha Secret (**bí mật**)
   - `HCAPTCHA_SITE_KEY` = hCaptcha Site Key
   - `ALLOWED_ORIGINS` = `https://tp.bongbup.online` (sửa theo website thật)
   - `OPENAI_MODEL` = `gpt-4.1`
   - `MAX_DAILY_CALLS` = `100`
   - `MAX_MINUTE_CALLS` = `6`
5. Trên Windows cài Node.js, mở PowerShell trong thư mục dự án và chạy:

```powershell
npx supabase login
npx supabase link --project-ref MA_DU_AN_CUA_BAN
npx supabase functions deploy read-expiry-date --no-verify-jwt
```

6. Mở `config.js`, thay `THAY_PROJECT_REF` bằng Project ref, thay `THAY_HCAPTCHA_SITE_KEY` bằng Site Key công khai.
7. Đưa file lên GitHub Pages. Nếu dùng domain khác `tp.bongbup.online`, sửa cả `CNAME`, `ALLOWED_ORIGINS` và danh sách domain hCaptcha cho thống nhất.
8. Truy cập website, bấm **Chụp / Chọn ảnh để tính** → AI tự đọc và điền ngày → kết quả được tính tự động. Bấm **⚙ Cài đặt** để xem chi tiết.

**Tuyệt đối không** nhập `OPENAI_API_KEY` hay `HCAPTCHA_SECRET` vào `config.js` hoặc đăng chúng lên GitHub.

Đọc `README.md` để xem chi tiết bảo mật, cách xử lý lỗi và mức giới hạn.
