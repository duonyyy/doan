const NhaCungCap = require('./NhaCungCap');
const KhuVuc = require('./KhuVuc');
const KhoHang = require('./KhoHang');
const SanPham = require('./SanPham');
const NhapKho = require('./NhapKho');
const ChiTietNhap = require('./ChiTietNhap');
const XuatKho = require('./XuatKho');
const ChiTietXuat = require('./ChiTietXuat');
const TonKho = require('./TonKho');

// Define associations
// KhuVuc -> KhoHang (One-to-Many)
KhuVuc.hasMany(KhoHang, { foreignKey: 'MaKhuVuc', as: 'KhoHangs' });
KhoHang.belongsTo(KhuVuc, { foreignKey: 'MaKhuVuc', as: 'KhuVuc' });

// NhaCungCap -> SanPham (One-to-Many)
NhaCungCap.hasMany(SanPham, { foreignKey: 'MaNCC', as: 'SanPhams' });
SanPham.belongsTo(NhaCungCap, { foreignKey: 'MaNCC', as: 'NhaCungCap' });

// NhaCungCap -> NhapKho (One-to-Many)
NhaCungCap.hasMany(NhapKho, { foreignKey: 'MaNCC', as: 'NhapKhos' });
NhapKho.belongsTo(NhaCungCap, { foreignKey: 'MaNCC', as: 'NhaCungCap' });

// KhoHang -> NhapKho (One-to-Many)
KhoHang.hasMany(NhapKho, { foreignKey: 'MaKho', as: 'NhapKhos' });
NhapKho.belongsTo(KhoHang, { foreignKey: 'MaKho', as: 'KhoHang' });

// KhoHang -> XuatKho (One-to-Many)
KhoHang.hasMany(XuatKho, { foreignKey: 'MaKho', as: 'XuatKhos' });
XuatKho.belongsTo(KhoHang, { foreignKey: 'MaKho', as: 'KhoHang' });

// NhapKho -> ChiTietNhap (One-to-Many)
NhapKho.hasMany(ChiTietNhap, { foreignKey: 'MaNhap', as: 'ChiTietNhaps' });
ChiTietNhap.belongsTo(NhapKho, { foreignKey: 'MaNhap', as: 'NhapKho' });

// SanPham -> ChiTietNhap (One-to-Many)
SanPham.hasMany(ChiTietNhap, { foreignKey: 'MaSP', as: 'ChiTietNhaps' });
ChiTietNhap.belongsTo(SanPham, { foreignKey: 'MaSP', as: 'SanPham' });

// XuatKho -> ChiTietXuat (One-to-Many)
XuatKho.hasMany(ChiTietXuat, { foreignKey: 'MaXuat', as: 'ChiTietXuats' });
ChiTietXuat.belongsTo(XuatKho, { foreignKey: 'MaXuat', as: 'XuatKho' });

// SanPham -> ChiTietXuat (One-to-Many)
SanPham.hasMany(ChiTietXuat, { foreignKey: 'MaSP', as: 'ChiTietXuats' });
ChiTietXuat.belongsTo(SanPham, { foreignKey: 'MaSP', as: 'SanPham' });

// SanPham -> TonKho (One-to-Many)
SanPham.hasMany(TonKho, { foreignKey: 'MaSP', as: 'TonKhos' });
TonKho.belongsTo(SanPham, { foreignKey: 'MaSP', as: 'SanPham' });

// KhoHang -> TonKho (One-to-Many)
KhoHang.hasMany(TonKho, { foreignKey: 'MaKho', as: 'TonKhos' });
TonKho.belongsTo(KhoHang, { foreignKey: 'MaKho', as: 'KhoHang' });

module.exports = {
  NhaCungCap,
  KhuVuc,
  KhoHang,
  SanPham,
  NhapKho,
  ChiTietNhap,
  XuatKho,
  ChiTietXuat,
  TonKho
};
