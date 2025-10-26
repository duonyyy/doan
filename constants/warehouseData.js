// Dữ liệu fake cho warehouse authentication
const WAREHOUSE_DATA = [
   {
    MaKho: 0, 
    TenKho: 'Tồng Công Ty',
    DiaDiem: 'Trụ sở chính',
    MaKhuVuc: 0, // MaKhuVuc = 0 sẽ trỏ về Master DB
    TenKhuVuc: 'Toàn Hệ Thống (Master)',
    MatKhau: '123456', // Mật khẩu cho kho master
    ShardKey: 'master', // Tên ShardKey để nhận diện
  },
  {
    MaKho: 1,
    TenKho: 'Kho Tổng Hà Nội',
    DiaDiem: 'KCN Thăng Long, Hà Nội',
    MaKhuVuc: 1,
    TenKhuVuc: 'Miền Bắc',
    MatKhau: '123456',
    ShardKey: 'shard1',
  },
  {
    MaKho: 2,
    TenKho: 'Kho Hải Phòng',
    DiaDiem: 'Quận Hồng Bàng, Hải Phòng',
    MaKhuVuc: 1,
    TenKhuVuc: 'Miền Bắc',
    MatKhau: '123456',
    ShardKey: 'shard1',
  },
  {
    MaKho: 3,
    TenKho: 'Kho Bắc Ninh',
    DiaDiem: 'KCN VSIP Bắc Ninh, Bắc Ninh',
    MaKhuVuc: 1,
    TenKhuVuc: 'Miền Bắc',
    MatKhau: '123456',
    ShardKey: 'shard1',
  },
  {
    MaKho: 4,
    TenKho: 'Kho Lạnh Đà Nẵng',
    DiaDiem: 'KCN Hòa Khánh, Đà Nẵng',
    MaKhuVuc: 2,
    TenKhuVuc: 'Miền Trung',
    MatKhau: '123456',
    ShardKey: 'shard2',
  },
  {
    MaKho: 5,
    TenKho: 'Kho Trung chuyển Huế',
    DiaDiem: 'TP. Huế, Thừa Thiên Huế',
    MaKhuVuc: 2,
    TenKhuVuc: 'Miền Trung',
    MatKhau: '123456',
    ShardKey: 'shard2',
  },
  {
    MaKho: 6,
    TenKho: 'Kho Vinh',
    DiaDiem: 'TP. Vinh, Nghệ An',
    MaKhuVuc: 2,
    TenKhuVuc: 'Miền Trung',
    MatKhau: '123456',
    ShardKey: 'shard2',
  },
  {
    MaKho: 7,
    TenKho: 'Kho Tổng TP. HCM',
    DiaDiem: 'KCN Tân Tạo, TP. HCM',
    MaKhuVuc: 3,
    TenKhuVuc: 'Miền Nam',
    MatKhau: '123456',
    ShardKey: 'shard3',
  },
  {
    MaKho: 8,
    TenKho: 'Kho Lạnh Bình Dương',
    DiaDiem: 'KCN Sóng Thần, Bình Dương',
    MaKhuVuc: 3,
    TenKhuVuc: 'Miền Nam',
    MatKhau: '123456',
    ShardKey: 'shard3',
  },
  {
    MaKho: 9,
    TenKho: 'Kho Cần Thơ',
    DiaDiem: 'KCN Trà Nóc, Cần Thơ',
    MaKhuVuc: 3,
    TenKhuVuc: 'Miền Nam',
    MatKhau: '123456',
    ShardKey: 'shard3',
  },
  {
    MaKho: 10,
    TenKho: 'Kho Đồng Nai',
    DiaDiem: 'KCN Biên Hòa, Đồng Nai',
    MaKhuVuc: 3,
    TenKhuVuc: 'Miền Nam',
    MatKhau: '123456',
    ShardKey: 'shard3',
  }, // --- MỚI THÊM ---
 
];

// Helper functions
const findWarehouseByName = (tenKho) => {
  return WAREHOUSE_DATA.find((kho) => kho.TenKho === tenKho);
};

const getAllWarehouses = () => {
  // Lọc bỏ dữ liệu trùng lặp trước khi trả về
  const uniqueWarehouses = [];
  const seenMaKho = new Set();

  WAREHOUSE_DATA.forEach((kho) => {
    if (!seenMaKho.has(kho.MaKho)) {
      seenMaKho.add(kho.MaKho);
      uniqueWarehouses.push({
        MaKho: kho.MaKho,
        TenKho: kho.TenKho,
        DiaDiem: kho.DiaDiem,
        MaKhuVuc: kho.MaKhuVuc,
        TenKhuVuc: kho.TenKhuVuc,
        ShardKey: kho.ShardKey,
      });
    }
  });
  return uniqueWarehouses;
};

const getWarehousesByRegion = (maKhuVuc) => {
  // Chuyển maKhuVuc sang kiểu số
  const regionId = parseInt(maKhuVuc, 10);
  return WAREHOUSE_DATA.filter((kho) => kho.MaKhuVuc === regionId);
};

module.exports = {
  WAREHOUSE_DATA,
  findWarehouseByName,
  getAllWarehouses,
  getWarehousesByRegion,
};
