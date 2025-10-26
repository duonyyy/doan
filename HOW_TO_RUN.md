# 🚀 QLKH Backend - Hướng dẫn chạy dự án

## 📋 Cách chạy dự án

### Phương pháp 1: Chế độ Demo (Khuyến nghị)
```bash
# Chạy server không cần database connection
npm run demo
```

### Phương pháp 2: Chế độ Development (Cần database)
```bash
# Chạy server với database connection
npm run dev
```

### Phương pháp 3: Sử dụng script tự động
```bash
# Windows (PowerShell)
.\run-project.ps1

# Windows (Command Prompt)
run-project.bat
```

### Phương pháp 4: Chạy thủ công
```bash
# 1. Cài đặt dependencies
npm install

# 2. Tạo file .env (nếu chưa có)
copy env.example .env

# 3. Chạy server
npm run dev
```

## 🌐 Truy cập ứng dụng

Sau khi server chạy thành công, bạn có thể truy cập:

- **Health Check**: http://localhost:8080/api/health
- **API Documentation**: http://localhost:8080/api/docs
- **Dashboard**: http://localhost:8080/dashboard

## 🔐 Test Authentication

### 1. Lấy danh sách kho
```bash
GET http://localhost:8080/api/auth/warehouses
```

### 2. Đăng nhập
```bash
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "TenKho": "Kho Tổng TP. HCM",
  "MatKhau": "123456"
}
```

### 3. Test kết nối database
```bash
GET http://localhost:8080/api/auth/test-master
GET http://localhost:8080/api/auth/test-connection/Kho Tổng TP. HCM
```

## 📊 Danh sách kho có sẵn

| Tên Kho | Khu Vực | Shard | Mật khẩu |
|---------|---------|-------|----------|
| Kho Tổng Hà Nội | Miền Bắc | shard1 | 123456 |
| Kho Hải Phòng | Miền Bắc | shard1 | 123456 |
| Kho Bắc Ninh | Miền Bắc | shard1 | 123456 |
| Kho Lạnh Đà Nẵng | Miền Trung | shard2 | 123456 |
| Kho Trung chuyển Huế | Miền Trung | shard2 | 123456 |
| Kho Vinh | Miền Trung | shard2 | 123456 |
| Kho Tổng TP. HCM | Miền Nam | shard3 | 123456 |
| Kho Lạnh Bình Dương | Miền Nam | shard3 | 123456 |
| Kho Cần Thơ | Miền Nam | shard3 | 123456 |
| Kho Đồng Nai | Miền Nam | shard3 | 123456 |

## 🛠️ Troubleshooting

### Lỗi "Cannot read properties of undefined"
- ✅ Đã fix trong realtimeReports.js
- Server sẽ chạy với simplified mode

### Lỗi database connection
- ⚠️ Database connection có thể fail nếu không có SQL Server
- ✅ Authentication vẫn hoạt động với fake data
- ✅ API endpoints vẫn hoạt động bình thường

### Port đã được sử dụng
```bash
# Dừng tất cả Node.js processes
taskkill /f /im node.exe

# Hoặc thay đổi port trong .env
PORT=3001
```

## 📝 Scripts có sẵn

```bash
npm start      # Chạy production
npm run dev    # Chạy development với database connection
npm run demo   # Chạy demo mode (không cần database)
npm test       # Test database connections
npm run docs   # Hiển thị thông tin documentation
```

## 🎉 Kết quả mong đợi

### Demo Mode (npm run demo):
```
🔍 Skipping database connection test (demo mode)
✅ Server running in demo mode - authentication uses fake data
🚀 Server is running on port 3000
📚 API Documentation: http://localhost:3000/api/docs
🔌 Socket.IO ready for real-time connections
📊 Real-time inventory reports enabled
🎯 Demo mode: Using fake data for authentication
```

### Development Mode (npm run dev):
```
🔍 Testing database connections...
✅ Master DB connected successfully
✅ shard1 connected successfully
✅ shard2 connected successfully
✅ shard3 connected successfully
🚀 Server is running on port 3000
📚 API Documentation: http://localhost:3000/api/docs
🔌 Socket.IO ready for real-time connections
📊 Real-time inventory reports enabled
```

Và có thể test các API endpoints như đã hướng dẫn ở trên!
