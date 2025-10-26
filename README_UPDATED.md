# QLKH Backend - Hệ thống Quản Lý Kho Hàng

## 📋 Tổng quan

Hệ thống backend API cho quản lý kho hàng với kiến trúc Database Sharding, hỗ trợ phân chia dữ liệu theo khu vực địa lý.

## 🏗️ Kiến trúc hệ thống

### Database Sharding
- **Master Database**: Lưu trữ dữ liệu tổng hợp, báo cáo toàn hệ thống
- **Shard 1 (Miền Bắc)**: Kho Hà Nội, Hải Phòng, Bắc Ninh
- **Shard 2 (Miền Trung)**: Kho Đà Nẵng, Huế, Vinh
- **Shard 3 (Miền Nam)**: Kho TP.HCM, Bình Dương, Cần Thơ, Đồng Nai

### Cấu trúc thư mục
```
QLKH_BACKEND/
├── config/                 # Cấu hình database và app
├── constants/              # Dữ liệu constants
├── controllers/            # Logic xử lý API
├── middlewares/            # Middleware xử lý
├── models/                 # Sequelize models
├── routers/                # API routes
├── services/               # Business logic services
├── socket/                 # Socket.IO real-time
├── utils/                  # Utility functions
├── postman/                # API testing collection
└── docs/                   # Documentation
```

## 🚀 Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình environment
Tạo file `.env` từ `env.example`:
```bash
cp env.example .env
```

Cấu hình các biến môi trường:
```env
# Master Database
MASTER_HOST=localhost
MASTER_PORT=1433
MASTER_USER=sa
MASTER_PASS=your_password
MASTER_DATABASE=QLKH_Master

# Shard 1 (Miền Bắc)
SHARD1_HOST=localhost
SHARD1_PORT=1434
SHARD1_USER=sa
SHARD1_PASS=your_password
SHARD1_DATABASE=QLKH_North

# Shard 2 (Miền Trung)
SHARD2_HOST=localhost
SHARD2_PORT=1434
SHARD2_USER=sa
SHARD2_PASS=your_password
SHARD2_DATABASE=QLKH_Central

# Shard 3 (Miền Nam)
SHARD3_HOST=localhost
SHARD3_PORT=1435
SHARD3_USER=sa
SHARD3_PASS=your_password
SHARD3_DATABASE=QLKH_South

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=development
```

### 3. Chạy ứng dụng
```bash
# Development mode
npm run dev

# Production mode
npm start

# Test database connections
npm test
```

## 🔐 Authentication

### Login API
```http
POST /api/auth/login
Content-Type: application/json

{
  "TenKho": "Kho Tổng TP. HCM",
  "MatKhau": "123456"
}
```

### Response
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "MaKho": 7,
    "TenKho": "Kho Tổng TP. HCM",
    "DiaDiem": "KCN Tân Tạo, TP. HCM",
    "MaKhuVuc": 3,
    "TenKhuVuc": "Miền Nam",
    "ShardKey": "shard3",
    "DatabaseInfo": {
      "region": "Miền Nam",
      "shard": "shard3",
      "connections": {
        "master": { "status": "connected" },
        "shard": { "status": "connected" }
      },
      "availableDatabases": {
        "master": {
          "name": "Master Database",
          "useCase": "Dữ liệu tổng hợp, báo cáo toàn hệ thống"
        },
        "shard": {
          "name": "shard3 Database",
          "useCase": "Dữ liệu cụ thể của Miền Nam"
        }
      }
    }
  }
}
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập kho hàng
- `GET /api/auth/warehouses` - Lấy danh sách kho
- `GET /api/auth/test-master` - Test kết nối Master DB
- `GET /api/auth/test-connection/:TenKho` - Test kết nối Shard DB

### Quản lý cơ bản
- `GET /api/nhacungcap` - Nhà cung cấp
- `GET /api/khuvuc` - Khu vực
- `GET /api/khohang` - Kho hàng
- `GET /api/sanpham` - Sản phẩm

### Nhập/Xuất kho
- `GET /api/nhapkho` - Nhập kho
- `GET /api/xuatkho` - Xuất kho
- `GET /api/chitietnhap` - Chi tiết nhập
- `GET /api/chitietxuat` - Chi tiết xuất

### Báo cáo
- `GET /api/tonkho` - Tồn kho
- `GET /api/doanhthu/thoigian` - Doanh thu theo thời gian
- `GET /api/doanhthu/sanpham` - Doanh thu theo sản phẩm
- `GET /api/doanhthu/kho` - Doanh thu theo kho

## 🔌 Real-time Features

### Socket.IO Events
- `inventory_update` - Cập nhật tồn kho
- `revenue_update` - Cập nhật doanh thu
- `connection` - Kết nối client
- `disconnect` - Ngắt kết nối

### Dashboard
Truy cập dashboard real-time: `http://localhost:3000/dashboard`

## 🧪 Testing

### Postman Collection
Import file `postman/QLKH_API_Collection.postman_collection.json` vào Postman để test API.

### Test Database Connections
```bash
npm test
```

## 📚 Documentation

- API Documentation: `http://localhost:3000/api/docs`
- Revenue API: `docs/REVENUE_API.md`
- Sharding Architecture: `docs/SHARDING_ARCHITECTURE.md`

## 🛠️ Development

### Scripts có sẵn
```bash
npm start      # Chạy production
npm run dev    # Chạy development với nodemon
npm test       # Test database connections
npm run docs   # Hiển thị thông tin documentation
```

### Cấu trúc Database
- **Master**: KhuVuc, NhaCungCap, SanPham (dữ liệu chung)
- **Shards**: KhoHang, NhapKho, XuatKho, TonKho (dữ liệu theo khu vực)

## 🔧 Troubleshooting

### Lỗi kết nối database
1. Kiểm tra cấu hình trong `.env`
2. Đảm bảo SQL Server đang chạy
3. Kiểm tra firewall và port
4. Chạy `npm test` để test connections

### Lỗi authentication
1. Kiểm tra tên kho và mật khẩu
2. Đảm bảo kho tồn tại trong hệ thống
3. Kiểm tra JWT_SECRET trong `.env`

## 📝 Changelog

### v1.0.0
- ✅ Hệ thống authentication với fake data
- ✅ Database sharding architecture
- ✅ Real-time updates với Socket.IO
- ✅ API endpoints đầy đủ
- ✅ Error handling và logging
- ✅ Postman collection
- ✅ Documentation

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

ISC License - Xem file LICENSE để biết thêm chi tiết.
