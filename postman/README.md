# QLKH API Postman Collection

## Hướng dẫn sử dụng Postman Collection

### 1. Import Collection
1. Mở Postman
2. Click "Import" 
3. Chọn file `QLKH_API_Collection.postman_collection.json`
4. Collection sẽ được import vào Postman

### 2. Thiết lập Environment (Tùy chọn)
Tạo environment mới với các biến:
- `baseUrl`: `http://localhost:3000/api`

### 3. Chạy Server
```bash
npm run dev
# hoặc
node index.js
```

### 4. Test API Endpoints

#### 🔍 Health Check & Documentation
- **GET** `/api/health` - Kiểm tra server
- **GET** `/api/docs` - Xem tài liệu API

#### 👥 Nhà Cung Cấp
- **GET** `/api/nhacungcap` - Lấy danh sách nhà cung cấp
- **GET** `/api/nhacungcap/:id` - Lấy nhà cung cấp theo ID
- **POST** `/api/nhacungcap` - Tạo nhà cung cấp mới
- **PUT** `/api/nhacungcap/:id` - Cập nhật nhà cung cấp
- **DELETE** `/api/nhacungcap/:id` - Xóa nhà cung cấp

#### 🏢 Khu Vực
- **GET** `/api/khuvuc` - Lấy danh sách khu vực
- **GET** `/api/khuvuc/:id` - Lấy khu vực theo ID
- **POST** `/api/khuvuc` - Tạo khu vực mới
- **PUT** `/api/khuvuc/:id` - Cập nhật khu vực
- **DELETE** `/api/khuvuc/:id` - Xóa khu vực

#### 🏪 Kho Hàng
- **GET** `/api/khohang` - Lấy danh sách kho hàng
- **GET** `/api/khohang/:id` - Lấy kho hàng theo ID
- **POST** `/api/khohang` - Tạo kho hàng mới
- **PUT** `/api/khohang/:id` - Cập nhật kho hàng
- **DELETE** `/api/khohang/:id` - Xóa kho hàng

#### 📦 Sản Phẩm
- **GET** `/api/sanpham` - Lấy danh sách sản phẩm
- **GET** `/api/sanpham/:id` - Lấy sản phẩm theo ID
- **POST** `/api/sanpham` - Tạo sản phẩm mới
- **PUT** `/api/sanpham/:id` - Cập nhật sản phẩm
- **DELETE** `/api/sanpham/:id` - Xóa sản phẩm

#### 📥 Nhập Kho
- **GET** `/api/nhapkho` - Lấy danh sách nhập kho
- **GET** `/api/nhapkho/:id` - Lấy nhập kho theo ID
- **POST** `/api/nhapkho` - Tạo phiếu nhập kho mới
- **PUT** `/api/nhapkho/:id` - Cập nhật phiếu nhập kho
- **DELETE** `/api/nhapkho/:id` - Xóa phiếu nhập kho

#### 📝 Chi Tiết Nhập
- **GET** `/api/chitietnhap` - Lấy danh sách chi tiết nhập
- **GET** `/api/chitietnhap/:maNhap/:maSP` - Lấy chi tiết nhập theo ID
- **POST** `/api/chitietnhap` - Tạo chi tiết nhập mới
- **PUT** `/api/chitietnhap/:maNhap/:maSP` - Cập nhật chi tiết nhập
- **DELETE** `/api/chitietnhap/:maNhap/:maSP` - Xóa chi tiết nhập

#### 📤 Xuất Kho
- **GET** `/api/xuatkho` - Lấy danh sách xuất kho
- **GET** `/api/xuatkho/:id` - Lấy xuất kho theo ID
- **POST** `/api/xuatkho` - Tạo phiếu xuất kho mới
- **PUT** `/api/xuatkho/:id` - Cập nhật phiếu xuất kho
- **DELETE** `/api/xuatkho/:id` - Xóa phiếu xuất kho

#### 📄 Chi Tiết Xuất
- **GET** `/api/chitietxuat` - Lấy danh sách chi tiết xuất
- **GET** `/api/chitietxuat/:maXuat/:maSP` - Lấy chi tiết xuất theo ID
- **POST** `/api/chitietxuat` - Tạo chi tiết xuất mới
- **PUT** `/api/chitietxuat/:maXuat/:maSP` - Cập nhật chi tiết xuất
- **DELETE** `/api/chitietxuat/:maXuat/:maSP` - Xóa chi tiết xuất

#### 📊 Tồn Kho
- **GET** `/api/tonkho` - Lấy danh sách tồn kho
- **GET** `/api/tonkho/summary` - Lấy tổng kết tồn kho
- **GET** `/api/tonkho/:maSP/:maKho` - Lấy tồn kho theo ID
- **PUT** `/api/tonkho/:maSP/:maKho` - Cập nhật tồn kho
- **DELETE** `/api/tonkho/:maSP/:maKho` - Xóa tồn kho

### 5. Thứ tự Test được khuyến nghị

#### Bước 1: Tạo dữ liệu cơ bản
1. **Tạo Khu Vực** - POST `/api/khuvuc`
2. **Tạo Nhà Cung Cấp** - POST `/api/nhacungcap`
3. **Tạo Kho Hàng** - POST `/api/khohang`
4. **Tạo Sản Phẩm** - POST `/api/sanpham`

#### Bước 2: Test nghiệp vụ nhập kho
1. **Tạo Phiếu Nhập Kho** - POST `/api/nhapkho`
2. **Xem Chi Tiết Nhập** - GET `/api/chitietnhap`
3. **Kiểm tra Tồn Kho** - GET `/api/tonkho`

#### Bước 3: Test nghiệp vụ xuất kho
1. **Tạo Phiếu Xuất Kho** - POST `/api/xuatkho`
2. **Xem Chi Tiết Xuất** - GET `/api/chitietxuat`
3. **Kiểm tra Tồn Kho sau xuất** - GET `/api/tonkho`

### 6. Query Parameters

#### Pagination
- `page`: Số trang (mặc định: 1)
- `limit`: Số bản ghi mỗi trang (mặc định: 10)

#### Search & Filter
- `search`: Tìm kiếm theo tên/mô tả
- `MaKho`: Lọc theo mã kho
- `MaNCC`: Lọc theo mã nhà cung cấp
- `MaSP`: Lọc theo mã sản phẩm
- `fromDate`: Ngày bắt đầu
- `toDate`: Ngày kết thúc
- `minQuantity`: Số lượng tối thiểu
- `maxQuantity`: Số lượng tối đa

### 7. Response Format

Tất cả API đều trả về format chuẩn:

```json
{
  "success": true,
  "message": "Thông báo",
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### 8. Error Handling

Khi có lỗi, API sẽ trả về:

```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "error": "Chi tiết lỗi"
}
```

### 9. Lưu ý quan trọng

- **Transaction**: Nhập/xuất kho sử dụng transaction để đảm bảo tính nhất quán
- **Inventory Management**: Tồn kho được tự động cập nhật khi nhập/xuất
- **Validation**: Tất cả dữ liệu đầu vào đều được validate
- **Constraints**: Không thể xóa dữ liệu có ràng buộc với bảng khác
- **Composite Keys**: Chi tiết nhập/xuất và tồn kho sử dụng khóa phức hợp

### 10. Troubleshooting

#### Lỗi kết nối database
- Kiểm tra file `.env` có đầy đủ thông tin kết nối
- Đảm bảo SQL Server đang chạy
- Kiểm tra firewall và network

#### Lỗi validation
- Kiểm tra dữ liệu đầu vào có đúng format
- Đảm bảo các trường bắt buộc được điền
- Kiểm tra foreign key constraints

#### Lỗi transaction
- Kiểm tra tồn kho trước khi xuất
- Đảm bảo dữ liệu nhất quán
- Kiểm tra business logic
