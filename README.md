# BKFASI - Trang Web Doanh Nghiệp (Corporate Landing Page)

Mã nguồn giao diện website giới thiệu công ty **BKFASI**, được thiết kế theo phong cách hiện đại, tối ưu trải nghiệm người dùng (UX/UI), chuẩn SEO và hoàn toàn responsive trên mọi thiết bị (máy tính, tablet, điện thoại).

---

## 📁 Cấu Trúc Mã Nguồn

```text
PRJ_WEB/
├── index.html        # Khung giao diện HTML5 chính
├── css/
│   └── style.css     # Định dạng CSS hiện đại, màu sắc nhận diện BKFASI
├── js/
│   └── main.js       # Xử lý hiệu ứng (menu mobile, lọc dự án, form liên hệ...)
└── README.md         # Hướng dẫn chạy và xuất bản (deploy) online
```

---

## 🚀 1. Cách Chạy Thử Trên Máy Tính (Local)

Có 3 cách đơn giản để xem ngay trên máy của bạn:

1. **Cách nhanh nhất:** 
   - Mở thư mục `PRJ_WEB`, nhấp đúp chuột trực tiếp vào file `index.html` để mở bằng trình duyệt (Chrome, Edge, Firefox, Cốc Cốc).
2. **Dùng VS Code Live Server:**
   - Nếu bạn dùng Visual Studio Code, cài extension **Live Server**, bấm chuột phải vào `index.html` chọn **Open with Live Server**.
3. **Dùng lệnh dòng lệnh (PowerShell / Terminal):**
   ```bash
   # Nếu máy có cài Python:
   python -m http.server 8000
   # Sau đó mở trình duyệt truy cập: http://localhost:8000
   ```

---

## 🌐 2. Hướng Dẫn Đăng Ký Tên Miền & Chạy Thử Miễn Phí (Free Hosting + Domain)

Hiện nay, các dịch vụ tên miền cấp 1 hoàn toàn miễn phí cũ (như `.tk`, `.ml`, `.ga` của Freenom) đã bị dừng hoạt động do chính sách quản lý quốc tế. 

Thay vào đó, **giải pháp chuẩn quốc tế, chuyên nghiệp, an toàn và 100% miễn phí vĩnh viễn** để chạy thử nghiệm và gửi cho khách hàng xem là sử dụng **Cloud Hosting kèm Tên miền Subdomain miễn phí có sẵn SSL (HTTPS)**:

---

### ⭐ Cách 1: Dùng Netlify Drop (Cực nhanh, chỉ mất 30 giây - Không cần gõ lệnh)

Đây là cách dễ nhất nếu bạn không muốn cài đặt bất kỳ công cụ nào:

1. Truy cập trang: [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. Kéo thả toàn bộ thư mục `PRJ_WEB` (chứa `index.html`, `css`, `js`) vào khung tải lên trên trình duyệt.
3. Trong vòng 5-10 giây, Netlify sẽ xuất bản trang web của bạn với một đường link chạy trực tuyến.
4. Bạn đăng ký tài khoản miễn phí để lưu website.
5. **Đổi tên miền miễn phí:**
   - Vào mục **Site configuration** -> **Change site name**.
   - Đặt tên bạn muốn (ví dụ: `bkfasi.netlify.app` hoặc `bkfasi-tech.netlify.app`).
   - Đường link của bạn sẽ là: `https://bkfasi.netlify.app` (có sẵn chứng chỉ bảo mật SSL xanh).

---

### ⭐ Cách 2: Dùng Vercel (Hiện đại, tốc độ cao)

Vercel là nền tảng điện toán đám mây hàng đầu hiện nay:

1. **Cách giao diện web:**
   - Đẩy mã nguồn lên tài khoản GitHub của bạn.
   - Truy cập [https://vercel.com](https://vercel.com) -> Đăng nhập bằng GitHub.
   - Bấm **Add New** -> **Project** -> Chọn kho chứa mã nguồn BKFASI -> Bấm **Deploy**.
   - Trang web của bạn sẽ có tên miền dạng `https://bkfasi.vercel.app`.
2. **Cách dùng dòng lệnh (CLI):**
   - Mở terminal trong thư mục `PRJ_WEB` và chạy:
     ```bash
     npx vercel
     ```
   - Làm theo các hướng dẫn trên màn hình, sau 30 giây bạn sẽ nhận được đường link trực tiếp.

---

### ⭐ Cách 3: Dùng GitHub Pages

Nếu bạn có tài khoản GitHub:

1. Tạo một repository mới trên GitHub (ví dụ tên: `bkfasi-web`).
2. Tải toàn bộ file trong thư mục `PRJ_WEB` lên nhánh `main`.
3. Vào mục **Settings** của repository -> Chọn thẻ **Pages** ở menu bên trái.
4. Ở mục **Build and deployment** > **Source**, chọn nhánh `main` và thư mục `/ (root)`, sau đó bấm **Save**.
5. Sau 1-2 phút, website của bạn sẽ hoạt động tại địa chỉ:
   `https://<tên-tài-khoản-github>.github.io/bkfasi-web/`

---

## 🏷️ 3. Khi Muốn Sử Dụng Tên Miền Riêng Chính Thức (`bkfasi.com` hoặc `bkfasi.vn`)

Khi chuẩn bị đưa website vào hoạt động kinh doanh chính thức:

1. **Mua tên miền quốc tế (`.com`, `.net`, `.io`):**
   - Giá khoảng 250.000đ - 350.000đ / năm tại các nhà đăng ký uy tín như Cloudflare Registrar, Namecheap, Google Domains (Squarespace), MatBao, PA Vietnam, Inet.
2. **Mua tên miền Việt Nam (`.vn`, `.com.vn`):**
   - Đăng ký tại các đơn vị ủy quyền của VNNIC (như Mắt Bão, PA Việt Nam, iNet, Viettel).
3. **Liên kết tên miền vào website:**
   - Dù dùng Vercel hay Netlify, bạn chỉ cần vào mục **Domains** -> Nhập tên miền riêng của bạn và trỏ bản ghi DNS (CNAME hoặc A record) theo hướng dẫn.

