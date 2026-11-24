# Tính Hạn Sử Dụng — GitHub Pages + Supabase Edge Functions

**Phiên bản này thay Cloudflare Worker bằng Supabase**, không cần người dùng nhập OpenAI API key. Giữ giao diện 1 nút **Chụp / Chọn ảnh để tính**, chế độ khoanh vùng chữ khó, cài đặt ẩn và đo thời gian bằng mili giây.

## Kiến trúc

`GitHub Pages (index.html + config.js)` → `hCaptcha invisible` → `Supabase Edge Function read-expiry-date` → `OpenAI Responses API` → **tự điền NSX/HSD và tính kết quả**.

- API key OpenAI nằm **chỉ trong Supabase Edge Function Secrets**. Không đưa vào HTML/JS, repository GitHub, hoặc Supabase `anon/publishable` key.
- hCaptcha vô hình chống bot; đôi khi người dùng vẫn phải giải CAPTCHA nếu được yêu cầu.
- PostgreSQL dùng SQL RPC `consume_hsd_quota` để **giới hạn đồng thời** theo ngày và phút (mặc định **100 yêu cầu/ngày**, **6 yêu cầu/phút** cho **toàn website**). Request OpenAI lỗi vẫn tính 1 lượt, vì chỗ trống được giữ trước khi gọi.
- Không lưu ảnh, khóa hoặc chữ in từ ảnh vào PostgreSQL; hai bộ đếm (ngày/phút, UTC) phục vụ kiểm soát sử dụng.
- CORS chỉ lọc website truy cập từ trình duyệt, **không phải lớp bảo mật**; hCaptcha xác thực phía server và quota là lớp kiểm soát chính.
- Mô hình mặc định **gpt-4.1** (ưu tiên nhận diện), có thể sửa `OPENAI_MODEL` bằng một model vision hỗ trợ Structured Outputs.

## A. Tạo dự án Supabase (chỉ làm một lần)

1. Truy cập https://supabase.com/dashboard, tạo project. Lưu lại **Project ref**, ví dụ `abcdefghijklmno`.
2. Tạo bảng và RPC hạn mức bằng **một trong hai cách**: (a) dùng **SQL Editor** và chạy nội dung file `supabase/migrations/20261124000000_hsd_quotas.sql`; hoặc (b) dùng **CLI** `npx supabase db push` sau khi liên kết dự án. Nếu thiếu SQL, Edge Function sẽ báo lỗi kiểm tra hạn mức và **không gọi OpenAI**.
3. Vào **Edge Functions → Secrets** trên Supabase Dashboard; thêm các biến:

| Secret / biến cấu hình | Giá trị ví dụ | Ghi chú |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key riêng của bạn | **Bí mật** |
| `HCAPTCHA_SECRET` | Secret do hCaptcha cấp | **Bí mật** |
| `HCAPTCHA_SITE_KEY` | Site key công khai từ hCaptcha | Dùng để máy chủ đối chiếu token |
| `ALLOWED_ORIGINS` | `https://tp.bongbup.online` | Phải khớp chính xác *origin*, không có `/` ở cuối; nếu dùng tên miền khác thì sửa |
| `OPENAI_MODEL` | `gpt-4.1` | Có thể thay model vision khác nếu tài khoản được cấp quyền |
| `MAX_DAILY_CALLS` | `100` | Hạn mức toàn website theo **ngày UTC** |
| `MAX_MINUTE_CALLS` | `6` | Hạn mức toàn website theo **phút** |

Supabase tự cấp `SUPABASE_URL` và `SUPABASE_SECRET_KEYS` (hoặc `SUPABASE_SERVICE_ROLE_KEY` ở dự án cũ); **không cần tạo lại**. Không bao giờ ghi các khóa quản trị Supabase vào `config.js`.

## B. Tạo hCaptcha (không cần Cloudflare)

1. Tạo tài khoản và tạo Site tại https://dashboard.hcaptcha.com/.
2. Trong cài đặt Site, bật **Domain Allowlisting** và cho phép tên miền đang dùng (ví dụ `tp.bongbup.online`). Nếu thử cục bộ, thêm `localhost` theo hỗ trợ của hCaptcha.
3. Copy **Site Key** vào `config.js` và vào biến `HCAPTCHA_SITE_KEY` trên Supabase; copy **Secret Key** vào `HCAPTCHA_SECRET` trên Supabase (KHÔNG đưa vào GitHub).
4. Widget dùng chế độ **invisible**: bình thường người dùng chỉ bấm chụp/chọn ảnh, không thấy checkbox; hCaptcha có thể xuất hiện thử thách khi nghi ngờ bot. Cần Internet và không chặn script `js.hcaptcha.com`.

## C. Triển khai Edge Function

Mở PowerShell/Terminal **tại thư mục gốc** (thư mục có `index.html`, `supabase/`). Máy cần Node.js để chạy CLI bằng `npx`.

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
# Chỉ chạy dòng tiếp theo nếu bạn CHƯA chạy SQL bằng SQL Editor:
npx supabase db push
npx supabase functions deploy read-expiry-date --no-verify-jwt
```

Chú ý: `verify_jwt = false` **có chủ đích** để website công khai truy cập mà không cần đăng nhập; **không có nghĩa API được gọi vô hạn**. Function chỉ cho gọi nếu hCaptcha hợp lệ + đúng origin + qua kiểm tra giới hạn SQL. Người dùng không cần Supabase `anon/publishable` key.

Nếu đã chạy SQL bằng SQL Editor, **bỏ dòng `npx supabase db push`**. Chỉ cần chạy migration theo một cách, tránh chạy SQL trùng.

Địa chỉ Function sau khi deploy:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/read-expiry-date
```

## D. Cấu hình GitHub Pages

Mở `config.js`, thay hai mục:

```js
window.HSD_CONFIG = {
  functionUrl: 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/read-expiry-date',
  captchaSiteKey: 'YOUR_PUBLIC_HCAPTCHA_SITE_KEY'
};
```

Upload các file `index.html`, `config.js`, `icon.png`, `manifest.json`, `sw.js`, `CNAME` cùng thư mục `supabase/` và `.gitignore` lên repo GitHub, bật **Settings → Pages → Deploy from a branch** (branch và thư mục đúng với site). Nếu dùng tên miền `tp.bongbup.online`, giữ `CNAME` như sẵn có; nếu khác, sửa `CNAME`, `ALLOWED_ORIGINS` và hCaptcha Domain Allowlisting **đồng bộ**. Nếu triển khai qua GitHub Pages subpath, `config.js` vẫn nằm cùng `index.html`.

**Tuyệt đối không** đăng `OPENAI_API_KEY`, `HCAPTCHA_SECRET`, `sb_secret_*`, `SUPABASE_SERVICE_ROLE_KEY` lên repository (kể cả GitHub Private, không cần thiết); sử dụng Dashboard Secrets.

## E. Sử dụng & kiểm tra

1. Vào website GitHub Pages theo HTTPS, chọn/chụp ảnh chứa NSX/HSD.
2. hCaptcha xác minh và Edge Function đọc ảnh bằng OpenAI.
3. Nếu đủ ngày rõ ràng, đúng định dạng, hợp lý và khớp chuỗi in trên ảnh, phần mềm **tự điền và tự tính**. Nếu thiếu/sai, cảnh báo và cho khoanh vùng đọc lại hoặc nhập tay.
4. Nút **⚙️ Cài đặt** mở thông tin AI, thời gian tính bằng ms, vùng ảnh và chức năng đọc lại. Kết quả tự động xuất hiện bên dưới.

Lỗi thường gặp:

| Lỗi | Nguyên nhân/Khắc phục |
|---|---|
| `Website chưa cấu hình` | Chưa sửa hai giá trị trong `config.js` |
| `hCaptcha chưa sẵn sàng` | Chưa tạo Site Key, script bị chặn hoặc localhost chưa cấu hình |
| HTTP 403 | Origin chưa thuộc `ALLOWED_ORIGINS`, hCaptcha token hết hạn/không hợp lệ |
| HTTP 429 | Hết hạn mức hệ thống hoặc quá 6 lượt trong cùng một phút |
| HTTP 503 | Thiếu Secrets, chưa chạy migration SQL, lỗi kết nối database |
| HTTP 502 | OpenAI key, model hoặc dịch vụ OpenAI có vấn đề; kiểm tra logs trên Supabase |
| Không có ngày | Ảnh chưa đọc được rõ hoặc AI không đủ chắc chắn; khoanh vùng NSX/HSD |

Chỉnh tốc độ/chi phí: giảm kích thước xử lý ảnh trong **⚙️ Cài đặt**, hoặc thay `OPENAI_MODEL` bằng model rẻ hơn nếu được hỗ trợ. **Thời gian ms** là thời gian thực tế tại thiết bị, không cam kết phản hồi trong vài mili giây.

## F. Bảo mật, giới hạn & riêng tư

- Hạn mức **100 lượt/ngày và 6 lượt/phút áp dụng toàn website**; tính cả lỗi sau khi đã đi tới OpenAI, để bảo vệ ngân sách tốt hơn. Đây là số yêu cầu, **không phải mức trần chi phí tuyệt đối bằng tiền**. Đặt ngân sách/cảnh báo trong OpenAI Platform.
- Nếu lượng truy cập cao, nâng cấp từ hCaptcha công khai sang Supabase Auth và quota theo tài khoản, hoặc bổ sung lớp anti-abuse chuyên dụng.
- CORS và domain allowlist **không thay thế xác thực**. Dù hCaptcha đã giúp ngăn lạm dụng tự động, không cơ chế nào bảo đảm chống được tất cả hành vi cố ý gây tốn phí.
- Ảnh được truyền từ browser qua Supabase đến OpenAI để nhận diện; không lưu lại trong database dự án này. Vẫn cần thông báo và xin phép phù hợp trước khi xử lý ảnh chứa thông tin cá nhân.
- Khi đổi phiên bản website, service worker có thể cache bản cũ; cần tải lại cứng / xóa dữ liệu offline nếu không thấy thay đổi.
- Có thể thu hồi OpenAI key cũ từng lộ trên GitHub và tạo key mới cho Supabase Secrets.

## Nội dung ZIP

- `index.html`: giao diện đọc ảnh & tính hạn, chức năng thủ công đầy đủ.
- `config.js`: **chỉ có URL Function và Site Key công khai**.
- `supabase/functions/read-expiry-date/index.ts`: endpoint bảo vệ OpenAI key.
- `supabase/migrations/20261124000000_hsd_quotas.sql`: SQL giới hạn yêu cầu atomic.
- `supabase/config.toml`: cấu hình Edge Function.
- `tests/test_edge.mjs`: kiểm thử mô phỏng endpoint, không gọi mạng thật.
