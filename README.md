# Đọc NSX/HSD bằng Supabase Secrets

## 1. Lưu Secrets
Mở https://supabase.com/dashboard và chọn dự án của bạn → Edge Functions → Secrets.
Thêm các giá trị sau (không nhập key thật trong index.ts hoặc config.js):

| Tên | Giá trị |
| --- | --- |
| OPENAI_API_KEY | API key OpenAI của bạn |
| OPENAI_MODEL | gpt-4.1-mini |
| SCAN_ACCESS_TOKEN | Chuỗi ngẫu nhiên riêng dài ít nhất 32 ký tự, tối đa 512 ký tự; không có khoảng trắng đầu/cuối |
| ALLOWED_ORIGINS | https://bongbup.online,http://localhost:8765,http://127.0.0.1:8765 |

ALLOWED_ORIGINS phải khớp địa chỉ website thật: chỉ giao thức + tên miền + cổng (nếu có), không có đường dẫn hoặc dấu / cuối. Nếu dùng https://ten.github.io/du-an thì thêm https://ten.github.io. Nếu dùng www hoặc tên miền phụ, thêm đúng tên miền đó, ngăn cách bằng dấu phẩy. CORS không thay thế xác thực; mã truy cập mới là thông tin cấp quyền.

Để tạo mã truy cập ngẫu nhiên trên PC có Python, mở CMD và chạy:
python -c "import secrets; print(secrets.token_urlsafe(32))"
Lưu riêng mã này để nhập trong Cài đặt website. Không lưu mã vào mã nguồn công khai, không dùng OpenAI key làm mã truy cập.

## 2. Triển khai scan-date
Trong Edge Functions mở hàm scan-date (hoặc tạo hàm mới tên scan-date bằng trình soạn thảo).
Thay nội dung index.ts bằng file supabase/functions/scan-date/index.ts trong gói này, rồi Deploy.
Trong cấu hình hàm, tắt Verify JWT / Enforce JWT verification cho scan-date.
Bản này KHÔNG sử dụng Supabase Auth JWT: hàm tự kiểm tra X-Scan-Token ở phía máy chủ. Nếu thiếu hoặc sai mã, hàm từ chối trước khi gọi OpenAI. Không xóa bước kiểm tra mã trong index.ts.

Nếu dùng CLI, gói có supabase/config.toml với verify_jwt=false. Có thể triển khai bằng:
supabase functions deploy scan-date --project-ref gpmuckoydhrokpioltem --no-verify-jwt
Không phải nhập anon key hay service_role key vào website.

## 3. Cấu hình website
config.js chỉ chứa scanUrl. Đã điền URL dự án bạn từng dùng:
https://gpmuckoydhrokpioltem.supabase.co/functions/v1/scan-date
Nếu dùng dự án khác, thay URL này bằng URL hàm của dự án đó.

Để thử trên PC: chạy start-test.bat (cần Python 3), mở http://localhost:8765.
Để đưa lên GitHub Pages: đăng các file website index.html, config.js, sw.js, manifest.json, icon.png, samples và CNAME nếu đang dùng đúng tên miền trong file. Không cần đăng thư mục supabase. Không cần Python khi dùng GitHub Pages.
Nếu nâng cấp từ bản trước, thay toàn bộ file website và tải lại bằng Ctrl+F5. Nếu vẫn thấy ô nhập OpenAI API key, xóa dữ liệu trang/service worker cũ rồi mở lại.

## 4. Thử ảnh
Mở Cài đặt, nhập MÃ TRUY CẬP (giá trị SCAN_ACCESS_TOKEN), rồi chọn ảnh.
KHÔNG nhập OpenAI API key vào website. Mã truy cập chỉ giữ trong ô nhập khi trang đang mở, không lưu localStorage; tải lại trang phải nhập lại.
Ảnh được gửi qua Supabase đến OpenAI. Các bước đối chiếu chuỗi ngày và tự tính được giữ lại. Mô hình do OPENAI_MODEL quyết định ở máy chủ; model mặc định hỗ trợ ảnh và JSON schema. Khi đổi model phải kiểm tra tính tương thích và quyền tài khoản.

## 5. Xử lý lỗi
- 401: kiểm tra mã truy cập. Nếu phản hồi ghi Invalid JWT/Missing authorization header, tắt Verify JWT riêng cho scan-date như bước 2.
- 403/CORS: kiểm tra ALLOWED_ORIGINS, đúng cả https/http và tên miền. Không mở index.html bằng file://.
- 404: URL sai hoặc chưa Deploy hàm.
- 413: ảnh quá lớn, chọn chế độ Ảnh gọn.
- 429: kiểm tra hạn mức OpenAI hoặc thử lại sau.
- 502: xem thông báo HTTP từ OpenAI; kiểm tra key, quyền model và kết nối.
- 503: thiếu OPENAI_API_KEY hoặc SCAN_ACCESS_TOKEN ngắn hơn 32 ký tự.
Không gửi ảnh chụp Secrets chứa key cho người khác.

## Phạm vi bản thử
OpenAI key chỉ có ở máy chủ. Người biết mã truy cập vẫn có thể gọi hàm và phát sinh phí; mã này không phải bí mật đối với chính người được cấp. Bản thử chưa có giới hạn lượt gọi bền vững theo người/ngày hoặc tài khoản riêng. Chỉ cấp mã cho người tin cậy; trước khi dùng rộng rãi cần bổ sung đăng nhập và hạn mức ở máy chủ. Có thể thu hồi quyền bằng cách đổi SCAN_ACCESS_TOKEN.
Đã kiểm tra cú pháp, tách key khỏi frontend, CORS, mã sai, thiếu Secrets, giới hạn kích thước, ảnh không hợp lệ, phản hồi thành công mô phỏng và lỗi API. Chưa triển khai thật, chưa kiểm tra trên Deno/Supabase thật và chưa gọi OpenAI bằng key của bạn. Không cam kết độ chính xác OCR; đối chiếu ngày trên bao bì trước khi dùng.

## Tài liệu
https://supabase.com/docs/guides/functions/secrets
https://supabase.com/docs/guides/functions/function-configuration
https://developers.openai.com/api/docs/models/gpt-4.1-mini
