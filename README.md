# 🏪 QLKH Backend - Hệ thống Quản lý Kho Hàng

## 📋 Tổng quan

Hệ thống quản lý kho hàng với kiến trúc sharding, real-time updates và phân tích doanh thu nâng cao. Sử dụng Node.js, Express.js, Sequelize ORM và Socket.IO.

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                    QLKH BACKEND SYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│  🌐 API Layer (Express.js + Socket.IO)                      │
│  ├── RESTful APIs                                           │
│  ├── Real-time WebSocket                                    │
│  └── Dashboard Interface                                    │
├─────────────────────────────────────────────────────────────┤
│  🎯 Business Logic Layer                                    │
│  ├── Controllers (CRUD Operations)                         │
│  ├── Services (Analytics & Reports)                        │
│  └── Socket Handlers (Real-time Updates)                  │
├─────────────────────────────────────────────────────────────┤
│  💾 Data Layer (Sharded Architecture)                      │
│  ├── Master DB (Global Data)                              │
│  ├── Shard 1 (KV1)                                        │
│  ├── Shard 2 (KV2)                                        │
│  └── Shard 3 (KV3)                                        │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Cấu trúc thư mục

```
QLKH_BACKEND/
├── 📁 config/                    # Cấu hình database
│   └── db.config.js            # Sharding configuration
├── 📁 controllers/              # Business logic
│   ├── nhaCungCapController.js # Nhà cung cấp
│   ├── khuVucController.js     # Khu vực
│   ├── khoHangController.js    # Kho hàng
│   ├── sanPhamController.js    # Sản phẩm
│   ├── nhapKhoController.js    # Nhập kho
│   ├── xuatKhoController.js    # Xuất kho
│   ├── tonKhoController.js     # Tồn kho
│   └── doanhThuController.js   # Doanh thu
├── 📁 models/                   # Database models
│   ├── NhaCungCap.js          # Model nhà cung cấp
│   ├── KhuVuc.js              # Model khu vực
│   ├── KhoHang.js             # Model kho hàng
│   ├── SanPham.js             # Model sản phẩm
│   ├── NhapKho.js             # Model nhập kho
│   ├── XuatKho.js             # Model xuất kho
│   ├── TonKho.js              # Model tồn kho
│   └── index.js               # Model associations
├── 📁 routers/                  # API routes
│   ├── nhaCungCapRoutes.js    # Routes nhà cung cấp
│   ├── khuVucRoutes.js        # Routes khu vực
│   ├── khoHangRoutes.js       # Routes kho hàng
│   ├── sanPhamRoutes.js       # Routes sản phẩm
│   ├── nhapKhoRoutes.js       # Routes nhập kho
│   ├── xuatKhoRoutes.js       # Routes xuất kho
│   ├── tonKhoRoutes.js        # Routes tồn kho
│   ├── doanhThuRoutes.js      # Routes doanh thu
│   └── index.js               # Main router
├── 📁 socket/                   # Real-time features
│   ├── socketServer.js        # Socket.IO server
│   ├── inventoryAnalytics.js # Inventory analytics
│   ├── realtimeReports.js     # Real-time reports
│   └── client-demo.html       # Demo dashboard
├── 📁 services/                 # Business services
│   └── revenueAnalytics.js    # Revenue analytics
├── 📁 docs/                     # Documentation
│   ├── SHARDING_ARCHITECTURE.md
│   └── REVENUE_API.md
├── 📁 postman/                  # API testing
│   ├── QLKH_API_Collection.postman_collection.json
│   ├── README.md
│   └── test-api.js
├── 📁 utils/                    # Utilities
│   └── shardingDemo.js       # Sharding demo
├── 📄 index.js                  # Main server file
├── 📄 package.json             # Dependencies
├── 📄 env.example              # Environment variables
└── 📄 README.md                 # This file
```

## 🚀 Cài đặt và chạy

### **1. Yêu cầu hệ thống**
- Node.js >= 14.0.0
- SQL Server >= 2016
- npm hoặc yarn

### **2. Cài đặt dependencies**
```bash
npm install
```

### **3. Cấu hình môi trường**
```bash
# Copy file môi trường
cp env.example .env

# Chỉnh sửa file .env với thông tin database
```

### **4. Cấu hình database**
```env
# Master Database
MASTER_HOST=100.81.38.120\WAREHOUSE_MAIN
MASTER_PORT=1433
MASTER_USER=sa
MASTER_PASS=123
MASTER_DATABASE=QUAN_LY_KHO_HANG

# Shard 1 (KV1)
SHARD1_HOST=192.168.1.100
SHARD1_PORT=1433
SHARD1_USER=sa
SHARD1_PASS=123
SHARD1_DATABASE=QUAN_LY_KHO_HANG_SHARD1

# Shard 2 (KV2)
SHARD2_HOST=192.168.1.101
SHARD2_PORT=1433
SHARD2_USER=sa
SHARD2_PASS=123
SHARD2_DATABASE=QUAN_LY_KHO_HANG_SHARD2

# Shard 3 (KV3)
SHARD3_HOST=192.168.1.102
SHARD3_PORT=1433
SHARD3_USER=sa
SHARD3_PASS=123
SHARD3_DATABASE=QUAN_LY_KHO_HANG_SHARD3

# Server Port
PORT=3000
```

### **5. Chạy server**
```bash
# Development mode
npm run dev

# Production mode
node index.js
```

## 📊 API Endpoints

### **Base URL**: `http://localhost:3000/api`

### **1. Nhà Cung Cấp**
```
GET    /api/nhacungcap          # Lấy danh sách
GET    /api/nhacungcap/:id      # Lấy theo ID
POST   /api/nhacungcap          # Tạo mới
PUT    /api/nhacungcap/:id      # Cập nhật
DELETE /api/nhacungcap/:id      # Xóa
```

### **2. Khu Vực**
```
GET    /api/khuvuc              # Lấy danh sách
GET    /api/khuvuc/:id          # Lấy theo ID
POST   /api/khuvuc              # Tạo mới
PUT    /api/khuvuc/:id          # Cập nhật
DELETE /api/khuvuc/:id          # Xóa
```

### **3. Kho Hàng**
```
GET    /api/khohang             # Lấy danh sách
GET    /api/khohang/:id         # Lấy theo ID
POST   /api/khohang             # Tạo mới
PUT    /api/khohang/:id         # Cập nhật
DELETE /api/khohang/:id         # Xóa
```

### **4. Sản Phẩm**
```
GET    /api/sanpham             # Lấy danh sách
GET    /api/sanpham/:id         # Lấy theo ID
POST   /api/sanpham             # Tạo mới
PUT    /api/sanpham/:id         # Cập nhật
DELETE /api/sanpham/:id         # Xóa
```

### **5. Nhập Kho**
```
GET    /api/nhapkho             # Lấy danh sách
GET    /api/nhapkho/:id         # Lấy theo ID
POST   /api/nhapkho             # Tạo phiếu nhập
PUT    /api/nhapkho/:id         # Cập nhật
DELETE /api/nhapkho/:id         # Xóa
```

### **6. Xuất Kho**
```
GET    /api/xuatkho             # Lấy danh sách
GET    /api/xuatkho/:id         # Lấy theo ID
POST   /api/xuatkho             # Tạo phiếu xuất
PUT    /api/xuatkho/:id         # Cập nhật
DELETE /api/xuatkho/:id         # Xóa
```

### **7. Tồn Kho**
```
GET    /api/tonkho              # Lấy danh sách
GET    /api/tonkho/summary      # Tổng kết
GET    /api/tonkho/:maSP/:maKho # Lấy theo ID
PUT    /api/tonkho/:maSP/:maKho # Cập nhật
DELETE /api/tonkho/:maSP/:maKho # Xóa
```

### **8. Doanh Thu**
```
GET    /api/doanhthu/thoigian   # Doanh thu theo thời gian
GET    /api/doanhthu/sanpham    # Doanh thu theo sản phẩm
GET    /api/doanhthu/kho        # Doanh thu theo kho
GET    /api/doanhthu/baocao     # Báo cáo tổng hợp
GET    /api/doanhthu/realtime   # Doanh thu real-time
```

### **9. Utility Endpoints**
```
GET    /api/health              # Health check
GET    /api/docs                # API documentation
GET    /dashboard               # Real-time dashboard
```

## 🔄 Sharding Architecture

### **Database Sharding**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MASTER DB      │    │    SHARD 1     │    │    SHARD 2     │    │    SHARD 3     │
│   (Global)       │    │   (KV1)        │    │   (KV2)        │    │   (KV3)        │
│                  │    │                 │    │                 │    │                 │
│ • NhaCungCap    │    │ • KhoHang       │    │ • KhoHang       │    │ • KhoHang       │
│ • KhuVuc        │    │ • NhapKho       │    │ • NhapKho       │    │ • NhapKho       │
│ • SanPham       │    │ • XuatKho       │    │ • XuatKho       │    │ • XuatKho       │
│ • TonKho        │    │ • ChiTietNhap   │    │ • ChiTietNhap   │    │ • ChiTietNhap   │
│                 │    │ • ChiTietXuat   │    │ • ChiTietXuat   │    │ • ChiTietXuat   │
│                 │    │ • TonKho        │    │ • TonKho        │    │ • TonKho        │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Routing Logic**
```javascript
function getDbConnection(maKhuVuc, isGlobalQuery, isReplicatedTable) {
  // Global queries → Master DB
  if (isGlobalQuery || isReplicatedTable || !maKhuVuc) {
    return masterDb;
  }
  
  // Sharded queries → Theo khu vực
  const shardMap = {
    'KV1': 'shard1',  // Server 2
    'KV2': 'shard2',  // Server 3  
    'KV3': 'shard3'   // Server 4
  };
  
  const shardKey = shardMap[maKhuVuc];
  return shards[shardKey] || masterDb;  // Fallback
}
```

## ⚡ Real-time Features

### **Socket.IO Events**

#### **Client → Server:**
```javascript
// Kết nối room
socket.emit('join-room', { maKhuVuc: 1, maKho: 5 });

// Lấy báo cáo
socket.emit('get-inventory-report', { 
  maKhuVuc: 1, 
  reportType: 'summary' 
});

// Subscribe real-time
socket.emit('subscribe-realtime', { 
  maKhuVuc: 1, 
  updateTypes: ['inventory', 'transactions'] 
});
```

#### **Server → Client:**
```javascript
// Báo cáo tồn kho
socket.on('inventory-report', (data) => {
  console.log('Báo cáo:', data);
});

// Cập nhật real-time
socket.on('inventory-update', (data) => {
  console.log('Tồn kho thay đổi:', data);
});

// Cảnh báo
socket.on('alert', (data) => {
  console.log('Cảnh báo:', data.message);
});
```

### **Real-time Dashboard**
- 📊 **Live Metrics**: Tồn kho, doanh thu real-time
- ⚠️ **Alerts**: Cảnh báo tồn kho thấp/cao
- 🔄 **Auto-refresh**: Tự động cập nhật
- 📱 **Responsive**: Giao diện responsive

## 📈 Analytics & Reports

### **1. Inventory Analytics**
- 📊 Tổng quan tồn kho
- 📈 Xu hướng tồn kho
- ⚠️ Cảnh báo tồn kho
- 📅 Báo cáo theo thời gian

### **2. Revenue Analytics**
- 💰 Doanh thu theo thời gian
- 🛍️ Doanh thu theo sản phẩm
- 🏪 Doanh thu theo kho
- 📊 Báo cáo tổng hợp
- 🔮 Dự báo doanh thu

### **3. Performance Metrics**
- 🏆 Top performers
- 📈 Growth rates
- 📅 Seasonal analysis
- 🔮 Forecasting

## 🧪 Testing

### **1. Postman Collection**
```bash
# Import collection
postman/QLKH_API_Collection.postman_collection.json

# Test all endpoints
# Health check, CRUD operations, Real-time features
```

### **2. Automated Testing**
```bash
# Run test script
node postman/test-api.js

# Test connections
node test-connections.js
```

### **3. Manual Testing**
```bash
# Start server
npm run dev

# Test endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/docs

# Test real-time dashboard
http://localhost:3000/dashboard
```

## 🔧 Configuration

### **Environment Variables**
```env
# Database Configuration
MASTER_HOST=100.81.38.120\WAREHOUSE_MAIN
MASTER_PORT=1433
MASTER_USER=sa
MASTER_PASS=123
MASTER_DATABASE=QUAN_LY_KHO_HANG

# Shard Configuration
SHARD1_HOST=192.168.1.100
SHARD1_PORT=1433
SHARD1_USER=sa
SHARD1_PASS=123
SHARD1_DATABASE=QUAN_LY_KHO_HANG_SHARD1

# Server Configuration
PORT=3000
```

### **Database Schema**
```sql
-- Master Tables (Global)
NhaCungCap (MaNCC, TenNCC, DiaChi, SDT)
KhuVuc (MaKhuVuc, TenKhuVuc)
SanPham (MaSP, TenSP, DonVi, MaNCC, MoTa)

-- Sharded Tables (Per KV)
KhoHang (MaKho, TenKho, DiaDiem, MaKhuVuc)
NhapKho (MaNhap, MaKho, MaNCC, NgayNhap, GhiChu)
XuatKho (MaXuat, MaKho, NgayXuat, GhiChu)
ChiTietNhap (MaNhap, MaSP, SoLuong, GiaNhap, Note)
ChiTietXuat (MaXuat, MaSP, SoLuong, GiaXuat, Note)
TonKho (MaSP, MaKho, SoLuongTon)
```

## 🚀 Deployment

### **1. Production Setup**
```bash
# Install dependencies
npm install --production

# Set environment variables
export NODE_ENV=production

# Start server
node index.js
```

### **2. Docker Deployment**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

### **3. PM2 Process Manager**
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start index.js --name qlkh-backend

# Monitor
pm2 monit
```

## 📊 Monitoring

### **Health Checks**
```bash
# API Health
GET /api/health

# Database Connections
# Automatic connection testing on startup
```

### **Performance Metrics**
- ⏱️ Response time
- 💾 Memory usage
- 🔄 Cache hit rate
- 📊 Database query performance

### **Logging**
```javascript
// Application logs
console.log('Server is running on port 3000');
console.log('Master DB connected');
console.log('Shard 1 connected');
```

## 🔒 Security

### **1. Input Validation**
- ✅ Required field validation
- ✅ Data type validation
- ✅ Business rule validation

### **2. Database Security**
- 🔐 Encrypted connections
- 🛡️ SQL injection prevention
- 🔑 Secure credentials

### **3. API Security**
- 🌐 CORS configuration
- 🍪 Cookie parsing
- 📝 Request logging

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Database Connection**
```bash
# Check database connectivity
node test-connections.js

# Verify environment variables
cat .env
```

#### **2. Socket.IO Issues**
```bash
# Check Socket.IO connection
# Open browser console on /dashboard
# Look for connection errors
```

#### **3. Sharding Issues**
```bash
# Test sharding logic
node utils/shardingDemo.js

# Check shard mapping
# Verify maKhuVuc values
```

### **Debug Mode**
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check specific modules
DEBUG=sequelize npm run dev
```

## 📚 Documentation

### **API Documentation**
- 📖 [Revenue API](docs/REVENUE_API.md)
- 🏗️ [Sharding Architecture](docs/SHARDING_ARCHITECTURE.md)
- 🧪 [Postman Collection](postman/README.md)

### **Code Documentation**
- 📝 Inline comments
- 📚 JSDoc annotations
- 🎯 Type definitions

## 🤝 Contributing

### **Development Workflow**
1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

### **Code Standards**
- ✅ ESLint configuration
- 📝 JSDoc comments
- 🧪 Unit tests
- 📚 Documentation updates

## 📄 License

ISC License - See LICENSE file for details

## 👥 Support

### **Contact**
- 📧 Email: support@qlkh.com
- 📱 Phone: +84-xxx-xxx-xxx
- 🌐 Website: https://qlkh.com

### **Documentation**
- 📚 API Docs: http://localhost:3000/api/docs
- 🎯 Dashboard: http://localhost:3000/dashboard
- 🧪 Testing: Import Postman collection

---

## 🎉 Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd QLKH_BACKEND

# 2. Install dependencies
npm install

# 3. Configure environment
cp env.example .env
# Edit .env with your database settings

# 4. Start server
npm run dev

# 5. Test API
# Open http://localhost:3000/api/docs
# Import Postman collection
# Open http://localhost:3000/dashboard
```

**🎯 Happy Coding!** 🚀
