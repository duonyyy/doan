# Kiến trúc Sharding - 4 Server SQL

## 🏗️ Tổng quan kiến trúc

API của bạn được thiết kế với kiến trúc **Sharding** để phân tán dữ liệu trên 4 server SQL:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MASTER DB     │    │    SHARD 1      │    │    SHARD 2      │    │    SHARD 3      │
│   (Global)      │    │   (KV1)         │    │   (KV2)         │    │   (KV3)         │
│                 │    │                 │    │                 │    │                 │
│ • NhaCungCap    │    │ • KhoHang       │    │ • KhoHang       │    │ • KhoHang       │
│ • KhuVuc        │    │ • NhapKho       │    │ • NhapKho       │    │ • NhapKho       │
│ • SanPham       │    │ • XuatKho       │    │ • XuatKho       │    │ • XuatKho       │
│ • TonKho        │    │ • ChiTietNhap   │    │ • ChiTietNhap   │    │ • ChiTietNhap   │
│                 │    │ • ChiTietXuat   │    │ • ChiTietXuat   │    │ • ChiTietXuat   │
│                 │    │ • TonKho        │    │ • TonKho        │    │ • TonKho        │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 Cách API lấy dữ liệu

### 1. **Routing Logic**

API sử dụng hàm `getDbConnection(maKhuVuc, isGlobalQuery, isReplicatedTable)` để quyết định lấy dữ liệu từ server nào:

```javascript
function getDbConnection(maKhuVuc, isGlobalQuery = false, isReplicatedTable = false) {
  // Nếu là query global hoặc bảng replicated → dùng Master DB
  if (isGlobalQuery || isReplicatedTable || !maKhuVuc) {
    return masterDb;
  }
  
  // Mapping MaKhuVuc → Shard
  const shardKey = shardMap[maKhuVuc];
  return shards[shardKey] || masterDb;
}
```

### 2. **Mapping Khu Vực → Server**

```javascript
const shardMap = {
  'KV1': 'shard1',  // Server 1
  'KV2': 'shard2',  // Server 2  
  'KV3': 'shard3',  // Server 3
  'KV4': 'shard4'   // Server 4
};
```

### 3. **Các loại Query**

#### **A. Global Queries (Master DB)**
- **NhaCungCap**: Luôn lấy từ Master DB
- **KhuVuc**: Luôn lấy từ Master DB  
- **SanPham**: Luôn lấy từ Master DB
- **Cross-shard queries**: Khi cần dữ liệu từ nhiều khu vực

#### **B. Sharded Queries (Theo Khu Vực)**
- **KhoHang**: Lấy từ shard tương ứng với MaKhuVuc
- **NhapKho**: Lấy từ shard của kho hàng
- **XuatKho**: Lấy từ shard của kho hàng
- **ChiTietNhap**: Lấy từ shard của phiếu nhập
- **ChiTietXuat**: Lấy từ shard của phiếu xuất
- **TonKho**: Lấy từ shard của kho hàng

## 📊 Ví dụ thực tế

### **Scenario 1: Tạo Kho Hàng**
```javascript
// POST /api/khohang
{
  "TenKho": "Kho A",
  "MaKhuVuc": 1  // KV1
}

// API sẽ:
// 1. Lấy connection từ shard1 (vì MaKhuVuc = 1 → KV1 → shard1)
// 2. Tạo KhoHang trong shard1
// 3. Trả về kết quả
```

### **Scenario 2: Tạo Nhập Kho**
```javascript
// POST /api/nhapkho
{
  "MaKho": 5,  // Kho thuộc KV2
  "MaNCC": 1,
  "NgayNhap": "2024-01-15",
  "chiTietNhap": [...]
}

// API sẽ:
// 1. Tìm KhoHang với MaKho=5 → thuộc KV2
// 2. Lấy connection từ shard2
// 3. Tạo NhapKho và ChiTietNhap trong shard2
// 4. Cập nhật TonKho trong shard2
```

### **Scenario 3: Lấy danh sách Sản Phẩm**
```javascript
// GET /api/sanpham

// API sẽ:
// 1. Lấy connection từ Master DB (vì SanPham là global)
// 2. Query từ Master DB
// 3. Trả về danh sách sản phẩm
```

### **Scenario 4: Lấy Tồn Kho theo Kho**
```javascript
// GET /api/tonkho?MaKho=5

// API sẽ:
// 1. Tìm KhoHang với MaKho=5 → thuộc KV2
// 2. Lấy connection từ shard2
// 3. Query TonKho từ shard2
// 4. Trả về tồn kho của kho đó
```

## 🔍 Cross-Shard Operations

### **Lấy Tồn Kho Tổng Hợp**
```javascript
// GET /api/tonkho (không có filter)

// API sẽ:
// 1. Query từ tất cả shards (shard1, shard2, shard3, shard4)
// 2. Merge kết quả
// 3. Trả về tổng hợp
```

### **Lấy Báo Cáo Toàn Hệ Thống**
```javascript
// GET /api/tonkho/summary

// API sẽ:
// 1. Query từ Master DB (global data)
// 2. Query từ tất cả shards (local data)
// 3. Tính toán tổng hợp
// 4. Trả về báo cáo
```

## ⚙️ Cấu hình Environment

### **File .env**
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

# Shard 4 (KV4)
SHARD4_HOST=192.168.1.103
SHARD4_PORT=1433
SHARD4_USER=sa
SHARD4_PASS=123
SHARD4_DATABASE=QUAN_LY_KHO_HANG_SHARD4
```

## 🚀 Lợi ích của kiến trúc này

### **1. Performance**
- Dữ liệu được phân tán → giảm tải cho từng server
- Query nhanh hơn vì chỉ truy cập 1 shard
- Có thể scale horizontal

### **2. Availability**
- Nếu 1 shard down → các shard khác vẫn hoạt động
- Master DB chứa dữ liệu quan trọng → ít bị ảnh hưởng

### **3. Data Locality**
- Dữ liệu của từng khu vực được lưu riêng biệt
- Dễ quản lý và backup theo khu vực

## 🔧 Troubleshooting

### **Lỗi kết nối shard**
```javascript
// API sẽ fallback về Master DB
const shardKey = shardMap[maKhuVuc];
return shards[shardKey] || masterDb;  // Fallback
```

### **Cross-shard transaction**
```javascript
// Sử dụng distributed transaction
const transaction = await masterDb.transaction();
// Hoặc implement 2PC (Two-Phase Commit)
```

### **Data consistency**
```javascript
// Đảm bảo dữ liệu nhất quán giữa các shard
// Sử dụng event sourcing hoặc eventual consistency
```

## 📈 Monitoring

### **Health Check**
```javascript
// Kiểm tra kết nối tất cả shards
async function testConnections() {
  await masterDb.authenticate();
  for (const [key, shard] of Object.entries(shards)) {
    await shard.authenticate();
    console.log(`${key} connected`);
  }
}
```

### **Metrics**
- Số lượng query per shard
- Response time per shard
- Error rate per shard
- Data distribution across shards
