# API Doanh Thu Xuất Kho

## 📊 Tổng quan

API doanh thu xuất kho cung cấp các tính năng phân tích và báo cáo doanh thu chi tiết, hỗ trợ sharding và real-time updates.

## 🚀 Endpoints

### **1. Doanh Thu Theo Thời Gian**
```
GET /api/doanhthu/thoigian
```

**Query Parameters:**
- `fromDate` (required): Ngày bắt đầu (YYYY-MM-DD)
- `toDate` (required): Ngày kết thúc (YYYY-MM-DD)
- `maKho` (optional): Mã kho
- `maKhuVuc` (optional): Mã khu vực
- `groupBy` (optional): Nhóm theo (day, week, month, year)
- `page` (optional): Trang (default: 1)
- `limit` (optional): Số bản ghi (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "tongDoanhThu": 15000000,
      "tongSoLuong": 500,
      "soPhieuXuat": 25,
      "doanhThuTrungBinh": 600000
    },
    "groupedData": [
      {
        "period": "2024-01-01",
        "tongDoanhThu": 500000,
        "tongSoLuong": 20,
        "soPhieuXuat": 2
      }
    ],
    "details": [...],
    "pagination": {...}
  }
}
```

### **2. Doanh Thu Theo Sản Phẩm**
```
GET /api/doanhthu/sanpham
```

**Query Parameters:**
- `fromDate` (required): Ngày bắt đầu
- `toDate` (required): Ngày kết thúc
- `maKho` (optional): Mã kho
- `maKhuVuc` (optional): Mã khu vực
- `maSP` (optional): Mã sản phẩm
- `page` (optional): Trang
- `limit` (optional): Số bản ghi

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "tongDoanhThu": 15000000,
      "soSanPham": 10,
      "sanPhamTop": [...]
    },
    "sanPhamRevenue": [
      {
        "maSP": 1,
        "tenSP": "Sản phẩm A",
        "donVi": "Cái",
        "nhaCungCap": "Nhà cung cấp A",
        "tongSoLuong": 100,
        "tongTien": 5000000,
        "giaTrungBinh": 50000,
        "soLanXuat": 5,
        "chiTiet": [...]
      }
    ]
  }
}
```

### **3. Doanh Thu Theo Kho**
```
GET /api/doanhthu/kho
```

**Query Parameters:**
- `fromDate` (required): Ngày bắt đầu
- `toDate` (required): Ngày kết thúc
- `maKhuVuc` (optional): Mã khu vực
- `page` (optional): Trang
- `limit` (optional): Số bản ghi

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "tongDoanhThu": 15000000,
      "soKho": 5,
      "khoTop": [...]
    },
    "khoRevenue": [
      {
        "maKho": 1,
        "tenKho": "Kho A",
        "khuVuc": "Khu vực 1",
        "tongDoanhThu": 5000000,
        "tongSoLuong": 200,
        "soPhieuXuat": 10,
        "soSanPham": 15
      }
    ]
  }
}
```

### **4. Báo Cáo Doanh Thu Tổng Hợp**
```
GET /api/doanhthu/baocao
```

**Query Parameters:**
- `fromDate` (required): Ngày bắt đầu
- `toDate` (required): Ngày kết thúc
- `maKhuVuc` (optional): Mã khu vực
- `reportType` (optional): Loại báo cáo (comprehensive, summary, trends)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "fromDate": "2024-01-01",
      "toDate": "2024-01-31"
    },
    "metrics": {
      "tongDoanhThu": 15000000,
      "tongSoLuong": 500,
      "soPhieuXuat": 25,
      "doanhThuTrungBinh": 600000,
      "doanhThuTrungBinhSanPham": 30000
    },
    "trends": {
      "daily": [...],
      "weekly": [...],
      "monthly": [...]
    },
    "topPerformers": {
      "topKho": [...],
      "topSanPham": [...]
    }
  }
}
```

### **5. Doanh Thu Real-time**
```
GET /api/doanhthu/realtime
```

**Query Parameters:**
- `maKhuVuc` (optional): Mã khu vực
- `maKho` (optional): Mã kho

**Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "tongDoanhThu": 500000,
      "tongSoLuong": 20,
      "soPhieuXuat": 3,
      "doanhThuTrungBinh": 166667
    },
    "week": {
      "tongDoanhThu": 2000000,
      "tongSoLuong": 80,
      "soPhieuXuat": 12,
      "doanhThuTrungBinh": 166667
    },
    "month": {
      "tongDoanhThu": 8000000,
      "tongSoLuong": 320,
      "soPhieuXuat": 45,
      "doanhThuTrungBinh": 177778
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🔧 Tính năng nâng cao

### **1. Sharding Support**
- API tự động route đến đúng shard dựa trên `maKhuVuc`
- Hỗ trợ cross-shard queries cho báo cáo tổng hợp
- Fallback về Master DB khi cần

### **2. Caching System**
- Cache kết quả phân tích trong 5 phút
- Tự động invalidate cache khi có dữ liệu mới
- Optimize performance cho queries phức tạp

### **3. Real-time Updates**
- Tích hợp với Socket.IO
- Broadcast doanh thu updates real-time
- Dashboard tự động refresh

### **4. Advanced Analytics**
- **Trend Analysis**: Phân tích xu hướng doanh thu
- **Product Performance**: Hiệu suất sản phẩm
- **Warehouse Performance**: Hiệu suất kho
- **Forecasting**: Dự báo doanh thu
- **Seasonality**: Phân tích mùa vụ

## 📈 Use Cases

### **1. Dashboard Quản Lý**
```javascript
// Lấy doanh thu hôm nay
GET /api/doanhthu/realtime?maKhuVuc=1

// Lấy báo cáo tháng
GET /api/doanhthu/baocao?fromDate=2024-01-01&toDate=2024-01-31&maKhuVuc=1
```

### **2. Phân Tích Sản Phẩm**
```javascript
// Top sản phẩm bán chạy
GET /api/doanhthu/sanpham?fromDate=2024-01-01&toDate=2024-01-31&limit=10

// Sản phẩm cụ thể
GET /api/doanhthu/sanpham?fromDate=2024-01-01&toDate=2024-01-31&maSP=1
```

### **3. Báo Cáo Kho**
```javascript
// Hiệu suất các kho
GET /api/doanhthu/kho?fromDate=2024-01-01&toDate=2024-01-31

// Kho cụ thể
GET /api/doanhthu/kho?fromDate=2024-01-01&toDate=2024-01-31&maKho=1
```

### **4. Xu Hướng Thời Gian**
```javascript
// Theo ngày
GET /api/doanhthu/thoigian?fromDate=2024-01-01&toDate=2024-01-31&groupBy=day

// Theo tuần
GET /api/doanhthu/thoigian?fromDate=2024-01-01&toDate=2024-01-31&groupBy=week

// Theo tháng
GET /api/doanhthu/thoigian?fromDate=2024-01-01&toDate=2024-01-31&groupBy=month
```

## 🎯 Performance Optimization

### **1. Database Optimization**
- Sử dụng indexes trên các trường thường query
- Partition data theo thời gian
- Optimize queries với proper joins

### **2. Caching Strategy**
- Cache kết quả phân tích phức tạp
- In-memory cache cho real-time data
- Redis cache cho cross-shard data

### **3. Pagination**
- Default limit: 50 records
- Maximum limit: 1000 records
- Efficient offset-based pagination

## 🔍 Error Handling

### **Common Errors:**
```json
// Missing required parameters
{
  "success": false,
  "message": "Ngày bắt đầu và ngày kết thúc là bắt buộc"
}

// Invalid date format
{
  "success": false,
  "message": "Định dạng ngày không hợp lệ"
}

// Database connection error
{
  "success": false,
  "message": "Lỗi kết nối database",
  "error": "Connection timeout"
}
```

## 📊 Sample Data

### **Revenue Summary:**
```json
{
  "summary": {
    "tongDoanhThu": 15000000,
    "tongSoLuong": 500,
    "soPhieuXuat": 25,
    "doanhThuTrungBinh": 600000,
    "doanhThuTrungBinhSanPham": 30000
  }
}
```

### **Product Performance:**
```json
{
  "sanPhamRevenue": [
    {
      "maSP": 1,
      "tenSP": "Sản phẩm A",
      "tongSoLuong": 100,
      "tongTien": 5000000,
      "giaTrungBinh": 50000,
      "soLanXuat": 5,
      "doanhThuTrungBinh": 1000000
    }
  ]
}
```

### **Time Trends:**
```json
{
  "trends": {
    "daily": [
      {
        "date": "2024-01-01",
        "doanhThu": 500000,
        "soPhieu": 2
      }
    ],
    "growthRate": 15.5
  }
}
```

## 🚀 Integration Examples

### **1. Frontend Dashboard**
```javascript
// Fetch real-time revenue
const response = await fetch('/api/doanhthu/realtime?maKhuVuc=1');
const data = await response.json();

// Update dashboard
updateDashboard(data.data);
```

### **2. Mobile App**
```javascript
// Get monthly revenue
const monthlyRevenue = await fetch(
  '/api/doanhthu/thoigian?fromDate=2024-01-01&toDate=2024-01-31&groupBy=day'
);
```

### **3. Analytics Integration**
```javascript
// Export revenue data
const report = await fetch(
  '/api/doanhthu/baocao?fromDate=2024-01-01&toDate=2024-01-31&reportType=comprehensive'
);
```

## 🔧 Configuration

### **Environment Variables:**
```env
# Cache timeout (milliseconds)
REVENUE_CACHE_TIMEOUT=300000

# Max records per page
MAX_REVENUE_LIMIT=1000

# Default pagination
DEFAULT_REVENUE_LIMIT=50
```

### **Database Indexes:**
```sql
-- Index for date range queries
CREATE INDEX idx_xuatkho_ngayxuat ON XuatKho(NgayXuat);

-- Index for warehouse queries
CREATE INDEX idx_xuatkho_makho ON XuatKho(MaKho);

-- Index for product queries
CREATE INDEX idx_chitietxuat_masp ON ChiTietXuat(MaSP);
```

## 📈 Monitoring

### **Key Metrics:**
- API response time
- Cache hit rate
- Database query performance
- Error rate
- Revenue calculation accuracy

### **Alerts:**
- High response time (>2s)
- Cache miss rate (>50%)
- Database connection errors
- Revenue calculation errors

## 🎉 Conclusion

API doanh thu xuất kho cung cấp:
- ✅ **Comprehensive Analytics**: Phân tích toàn diện
- ✅ **Real-time Updates**: Cập nhật thời gian thực
- ✅ **Sharding Support**: Hỗ trợ phân tán dữ liệu
- ✅ **Performance Optimized**: Tối ưu hiệu suất
- ✅ **Flexible Reporting**: Báo cáo linh hoạt
- ✅ **Easy Integration**: Dễ dàng tích hợp
