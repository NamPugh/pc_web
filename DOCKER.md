# Chạy frontend và backend bằng hai container độc lập

Frontend và backend có Docker Compose riêng. Không còn Compose chung ở thư mục gốc và Docker không tự tạo MongoDB.

## 1. Chạy backend

Backend đọc trực tiếp cấu hình từ `backend/.env`.

```powershell
cd backend
docker compose up -d --build
```

Kiểm tra:

- API: http://localhost:5000
- Health check: http://localhost:5000/api/health

Nếu MongoDB đang chạy trực tiếp trên máy và chuỗi kết nối dùng `localhost`, hãy đổi hostname thành `host.docker.internal`:

```env
MONGODB_CONNECTIONSTRING=mongodb://host.docker.internal:27017/pc_web
```

MongoDB Atlas không cần thay đổi hostname.

## 2. Chạy frontend

Mở terminal khác:

```powershell
cd frontend
docker compose up -d --build
```

Website chạy tại:

```text
http://localhost:5173
```

Frontend mặc định chuyển `/api` và `/uploads` tới:

```text
http://host.docker.internal:5000
```

Nếu backend nằm trên máy chủ khác, tạo `frontend/.env`:

```env
FRONTEND_PORT=5173
BACKEND_UPSTREAM=http://192.168.1.20:5000
```

Sau đó build lại frontend.

## 3. Xem log

```powershell
cd backend
docker compose logs -f
```

```powershell
cd frontend
docker compose logs -f
```

## 4. Dừng từng container

```powershell
cd backend
docker compose down
```

```powershell
cd frontend
docker compose down
```

Không dùng `docker compose down -v` cho backend nếu muốn giữ các ảnh đã upload.

## VNPay

Trong `backend/.env`, Return URL khi chạy Docker local nên là:

```env
VNPAY_RETURN_URL=http://localhost:5173/payment/vnpay-return
```

Khi triển khai thật, đổi sang domain frontend. IPN đăng ký với VNPay:

```text
https://your-domain.com/api/payments/vnpay/ipn
```
