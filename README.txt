BẢN DASHBOARD QUẢN LÝ HÀNG LỖI
===============================

Các phần đã bổ sung:
- Giao diện dashboard tổng quan hiện đại, responsive cho PC và điện thoại.
- Bộ lọc thống kê: 7 ngày, 30 ngày, 90 ngày và toàn bộ dữ liệu.
- 4 thẻ KPI: tổng số lượng lỗi, chờ xử lý, đang sửa, đã hoàn thành.
- So sánh số lượng lỗi với kỳ trước.
- Biểu đồ xu hướng số báo cáo phát sinh.
- Biểu đồ tròn tỷ lệ trạng thái xử lý.
- Top 5 nhà cung cấp có nhiều báo cáo lỗi.
- Danh sách hàng lỗi cần ưu tiên; bấm vào để mở cập nhật trạng thái.
- Hiển thị số mục đang có trong bảng sau khi tìm kiếm/lọc.
- Giữ nguyên các chức năng cũ: báo lỗi, hình ảnh, Excel, lịch sử, tài khoản, thông báo và nhật ký.

File chính:
- index.html
- style.css
- app.js
- mobile.js
- supabase.js

Lưu ý triển khai:
- Thay toàn bộ các file cùng tên trên hosting bằng file trong gói này.
- Giữ nguyên cấu hình Supabase hiện tại trong supabase.js.
- Nếu GitHub Pages hoặc trình duyệt còn cache bản cũ, hãy hard refresh hoặc tăng CACHE_NAME trong service-worker.js của thư mục cha.


DASHBOARD V2 - NÂNG CẤP
=======================
1. Chạy SUPABASE_UPGRADE_V2.sql trong Supabase SQL Editor trước khi dùng phần thời gian xử lý.
2. Tải toàn bộ các file lên hosting, ghi đè bản cũ.
3. Nhấn Ctrl + F5 hoặc tăng CACHE_NAME của service-worker nếu giao diện vẫn còn bản cũ.

Nâng cấp chính:
- Escape dữ liệu động ở dashboard, lịch sử, danh mục, tài khoản và nhật ký.
- Danh sách ưu tiên lấy toàn bộ hàng chưa hoàn thành, ưu tiên quá hạn và nghiêm trọng.
- KPI đều dùng số lượng sản phẩm làm số chính; số báo cáo nằm ở dòng phụ.
- Lưu người phụ trách, hạn xử lý, thời điểm bắt đầu/hoàn thành và ghi chú kết quả.
- Lọc nhanh bằng KPI, top NCC, mức độ và thời hạn; hỗ trợ ngày tùy chọn và thu gọn dashboard.
