const { XuatKho, ChiTietXuat, SanPham, KhoHang, TonKho } = require('../models');
const { Op } = require('sequelize');
const { getDbConnection } = require('../config/db.config');

/**
 * Lấy doanh thu theo khoảng thời gian
 */
const getDoanhThuTheoThoiGian = async (req, res) => {
  try {
    const { 
      fromDate, 
      toDate, 
      maKho, 
      maKhuVuc, 
      groupBy = 'day', // day, week, month, year
      page = 1, 
      limit = 50 
    } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: 'Ngày bắt đầu và ngày kết thúc là bắt buộc'
      });
    }

    const offset = (page - 1) * limit;
    let whereClause = {
      NgayXuat: {
        [Op.between]: [fromDate, toDate]
      }
    };

    if (maKho) whereClause.MaKho = maKho;

    // Lấy connection dựa trên khu vực
    const connection = getDbConnection(maKhuVuc, false, false);
    
    const { count, rows } = await connection.models.XuatKho.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: KhoHang,
          as: 'KhoHang',
          include: [
            {
              model: require('../models').KhuVuc,
              as: 'KhuVuc'
            }
          ],
          ...(maKhuVuc && { where: { MaKhuVuc: maKhuVuc } })
        },
        {
          model: ChiTietXuat,
          as: 'ChiTietXuats',
          include: [
            {
              model: SanPham,
              as: 'SanPham'
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['NgayXuat', 'DESC']]
    });

    // Tính toán doanh thu
    const doanhThuData = rows.map(xuat => {
      const tongTien = xuat.ChiTietXuats.reduce((sum, chiTiet) => 
        sum + (chiTiet.SoLuong * chiTiet.GiaXuat), 0);
      
      return {
        ...xuat.toJSON(),
        tongTien,
        soLuongSanPham: xuat.ChiTietXuats.length
      };
    });

    // Group by time period
    const groupedData = groupByTimePeriod(doanhThuData, groupBy);
    
    // Tính tổng doanh thu
    const tongDoanhThu = doanhThuData.reduce((sum, item) => sum + item.tongTien, 0);
    const tongSoLuong = doanhThuData.reduce((sum, item) => 
      sum + item.ChiTietXuats.reduce((ctSum, ct) => ctSum + ct.SoLuong, 0), 0);

    res.json({
      success: true,
      data: {
        summary: {
          tongDoanhThu,
          tongSoLuong,
          soPhieuXuat: count,
          doanhThuTrungBinh: count > 0 ? tongDoanhThu / count : 0
        },
        groupedData,
        details: doanhThuData,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy doanh thu theo thời gian',
      error: error.message
    });
  }
};

/**
 * Lấy doanh thu theo sản phẩm
 */
const getDoanhThuTheoSanPham = async (req, res) => {
  try {
    const { 
      fromDate, 
      toDate, 
      maKho, 
      maKhuVuc, 
      maSP,
      page = 1, 
      limit = 50 
    } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: 'Ngày bắt đầu và ngày kết thúc là bắt buộc'
      });
    }

    const offset = (page - 1) * limit;
    const connection = getDbConnection(maKhuVuc, false, false);

    // Lấy chi tiết xuất kho
    let whereClause = {
      NgayXuat: {
        [Op.between]: [fromDate, toDate]
      }
    };

    if (maKho) whereClause.MaKho = maKho;

    const xuatKhoData = await connection.models.XuatKho.findAll({
      where: whereClause,
      include: [
        {
          model: KhoHang,
          as: 'KhoHang',
          include: [
            {
              model: require('../models').KhuVuc,
              as: 'KhuVuc'
            }
          ],
          ...(maKhuVuc && { where: { MaKhuVuc: maKhuVuc } })
        },
        {
          model: ChiTietXuat,
          as: 'ChiTietXuats',
          where: maSP ? { MaSP: maSP } : {},
          include: [
            {
              model: SanPham,
              as: 'SanPham',
              include: [
                {
                  model: require('../models').NhaCungCap,
                  as: 'NhaCungCap'
                }
              ]
            }
          ]
        }
      ],
      order: [['NgayXuat', 'DESC']]
    });

    // Group by sản phẩm
    const sanPhamRevenue = {};
    
    xuatKhoData.forEach(xuat => {
      xuat.ChiTietXuats.forEach(chiTiet => {
        const maSP = chiTiet.MaSP;
        const tenSP = chiTiet.SanPham.TenSP;
        
        if (!sanPhamRevenue[maSP]) {
          sanPhamRevenue[maSP] = {
            maSP,
            tenSP,
            donVi: chiTiet.SanPham.DonVi,
            nhaCungCap: chiTiet.SanPham.NhaCungCap?.TenNCC,
            tongSoLuong: 0,
            tongTien: 0,
            giaTrungBinh: 0,
            soLanXuat: 0,
            chiTiet: []
          };
        }
        
        const doanhThu = chiTiet.SoLuong * chiTiet.GiaXuat;
        sanPhamRevenue[maSP].tongSoLuong += chiTiet.SoLuong;
        sanPhamRevenue[maSP].tongTien += doanhThu;
        sanPhamRevenue[maSP].soLanXuat += 1;
        sanPhamRevenue[maSP].chiTiet.push({
          maXuat: xuat.MaXuat,
          ngayXuat: xuat.NgayXuat,
          soLuong: chiTiet.SoLuong,
          giaXuat: chiTiet.GiaXuat,
          doanhThu,
          kho: xuat.KhoHang.TenKho,
          khuVuc: xuat.KhoHang.KhuVuc?.TenKhuVuc
        });
      });
    });

    // Tính giá trung bình
    Object.values(sanPhamRevenue).forEach(sp => {
      sp.giaTrungBinh = sp.tongSoLuong > 0 ? sp.tongTien / sp.tongSoLuong : 0;
    });

    // Sort by doanh thu
    const sortedSanPham = Object.values(sanPhamRevenue)
      .sort((a, b) => b.tongTien - a.tongTien)
      .slice(offset, offset + parseInt(limit));

    const tongDoanhThu = Object.values(sanPhamRevenue)
      .reduce((sum, sp) => sum + sp.tongTien, 0);

    res.json({
      success: true,
      data: {
        summary: {
          tongDoanhThu,
          soSanPham: Object.keys(sanPhamRevenue).length,
          sanPhamTop: sortedSanPham.slice(0, 5)
        },
        sanPhamRevenue: sortedSanPham,
        pagination: {
          total: Object.keys(sanPhamRevenue).length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(Object.keys(sanPhamRevenue).length / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy doanh thu theo sản phẩm',
      error: error.message
    });
  }
};

/**
 * Lấy doanh thu theo kho
 */
const getDoanhThuTheoKho = async (req, res) => {
  try {
    const { 
      fromDate, 
      toDate, 
      maKhuVuc, 
      page = 1, 
      limit = 50 
    } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: 'Ngày bắt đầu và ngày kết thúc là bắt buộc'
      });
    }

    const connection = getDbConnection(maKhuVuc, false, false);
    
    let whereClause = {
      NgayXuat: {
        [Op.between]: [fromDate, toDate]
      }
    };

    const xuatKhoData = await connection.models.XuatKho.findAll({
      where: whereClause,
      include: [
        {
          model: KhoHang,
          as: 'KhoHang',
          include: [
            {
              model: require('../models').KhuVuc,
              as: 'KhuVuc'
            }
          ],
          ...(maKhuVuc && { where: { MaKhuVuc: maKhuVuc } })
        },
        {
          model: ChiTietXuat,
          as: 'ChiTietXuats',
          include: [
            {
              model: SanPham,
              as: 'SanPham'
            }
          ]
        }
      ],
      order: [['NgayXuat', 'DESC']]
    });

    // Group by kho
    const khoRevenue = {};
    
    xuatKhoData.forEach(xuat => {
      const maKho = xuat.MaKho;
      const tenKho = xuat.KhoHang.TenKho;
      const khuVuc = xuat.KhoHang.KhuVuc?.TenKhuVuc;
      
      if (!khoRevenue[maKho]) {
        khoRevenue[maKho] = {
          maKho,
          tenKho,
          khuVuc,
          tongDoanhThu: 0,
          tongSoLuong: 0,
          soPhieuXuat: 0,
          soSanPham: new Set(),
          chiTiet: []
        };
      }
      
      const doanhThu = xuat.ChiTietXuats.reduce((sum, ct) => 
        sum + (ct.SoLuong * ct.GiaXuat), 0);
      const soLuong = xuat.ChiTietXuats.reduce((sum, ct) => sum + ct.SoLuong, 0);
      
      khoRevenue[maKho].tongDoanhThu += doanhThu;
      khoRevenue[maKho].tongSoLuong += soLuong;
      khoRevenue[maKho].soPhieuXuat += 1;
      
      xuat.ChiTietXuats.forEach(ct => {
        khoRevenue[maKho].soSanPham.add(ct.MaSP);
      });
      
      khoRevenue[maKho].chiTiet.push({
        maXuat: xuat.MaXuat,
        ngayXuat: xuat.NgayXuat,
        doanhThu,
        soLuong,
        soSanPham: xuat.ChiTietXuats.length
      });
    });

    // Convert Set to number
    Object.values(khoRevenue).forEach(kho => {
      kho.soSanPham = kho.soSanPham.size;
    });

    // Sort by doanh thu
    const sortedKho = Object.values(khoRevenue)
      .sort((a, b) => b.tongDoanhThu - a.tongDoanhThu);

    const tongDoanhThu = Object.values(khoRevenue)
      .reduce((sum, kho) => sum + kho.tongDoanhThu, 0);

    res.json({
      success: true,
      data: {
        summary: {
          tongDoanhThu,
          soKho: Object.keys(khoRevenue).length,
          khoTop: sortedKho.slice(0, 5)
        },
        khoRevenue: sortedKho,
        pagination: {
          total: Object.keys(khoRevenue).length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(Object.keys(khoRevenue).length / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy doanh thu theo kho',
      error: error.message
    });
  }
};

/**
 * Lấy báo cáo doanh thu tổng hợp
 */
const getBaoCaoDoanhThu = async (req, res) => {
  try {
    const { 
      fromDate, 
      toDate, 
      maKhuVuc, 
      reportType = 'comprehensive' // comprehensive, summary, trends
    } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: 'Ngày bắt đầu và ngày kết thúc là bắt buộc'
      });
    }

    const connection = getDbConnection(maKhuVuc, false, false);
    
    let whereClause = {
      NgayXuat: {
        [Op.between]: [fromDate, toDate]
      }
    };

    const xuatKhoData = await connection.models.XuatKho.findAll({
      where: whereClause,
      include: [
        {
          model: KhoHang,
          as: 'KhoHang',
          include: [
            {
              model: require('../models').KhuVuc,
              as: 'KhuVuc'
            }
          ],
          ...(maKhuVuc && { where: { MaKhuVuc: maKhuVuc } })
        },
        {
          model: ChiTietXuat,
          as: 'ChiTietXuats',
          include: [
            {
              model: SanPham,
              as: 'SanPham'
            }
          ]
        }
      ],
      order: [['NgayXuat', 'ASC']]
    });

    // Tính toán metrics
    const metrics = calculateRevenueMetrics(xuatKhoData);
    
    // Xu hướng theo thời gian
    const trends = calculateRevenueTrends(xuatKhoData);
    
    // Top performers
    const topPerformers = calculateTopPerformers(xuatKhoData);

    let reportData = {
      period: { fromDate, toDate },
      metrics,
      trends,
      topPerformers
    };

    if (reportType === 'comprehensive') {
      // Thêm chi tiết đầy đủ
      reportData.details = {
        dailyBreakdown: trends.daily,
        weeklyBreakdown: trends.weekly,
        monthlyBreakdown: trends.monthly
      };
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy báo cáo doanh thu',
      error: error.message
    });
  }
};

/**
 * Lấy doanh thu real-time
 */
const getDoanhThuRealTime = async (req, res) => {
  try {
    const { maKhuVuc, maKho } = req.query;
    
    const connection = getDbConnection(maKhuVuc, false, false);
    
    // Hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let whereClause = {
      NgayXuat: {
        [Op.gte]: today
      }
    };
    
    if (maKho) whereClause.MaKho = maKho;

    const todayData = await connection.models.XuatKho.findAll({
      where: whereClause,
      include: [
        {
          model: ChiTietXuat,
          as: 'ChiTietXuats'
        }
      ]
    });

    // Tuần này
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekData = await connection.models.XuatKho.findAll({
      where: {
        NgayXuat: {
          [Op.gte]: weekStart
        },
        ...(maKho && { MaKho: maKho })
      },
      include: [
        {
          model: ChiTietXuat,
          as: 'ChiTietXuats'
        }
      ]
    });

    // Tháng này
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const monthData = await connection.models.XuatKho.findAll({
      where: {
        NgayXuat: {
          [Op.gte]: monthStart
        },
        ...(maKho && { MaKho: maKho })
      },
      include: [
        {
          model: ChiTietXuat,
          as: 'ChiTietXuats'
        }
      ]
    });

    const realTimeData = {
      today: calculatePeriodRevenue(todayData),
      week: calculatePeriodRevenue(weekData),
      month: calculatePeriodRevenue(monthData),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: realTimeData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy doanh thu real-time',
      error: error.message
    });
  }
};

// Helper functions
function groupByTimePeriod(data, groupBy) {
  const grouped = {};
  
  data.forEach(item => {
    let key;
    const date = new Date(item.NgayXuat);
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = date.getFullYear().toString();
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    if (!grouped[key]) {
      grouped[key] = {
        period: key,
        tongDoanhThu: 0,
        tongSoLuong: 0,
        soPhieuXuat: 0,
        chiTiet: []
      };
    }
    
    grouped[key].tongDoanhThu += item.tongTien;
    grouped[key].tongSoLuong += item.ChiTietXuats.reduce((sum, ct) => sum + ct.SoLuong, 0);
    grouped[key].soPhieuXuat += 1;
    grouped[key].chiTiet.push(item);
  });
  
  return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
}

function calculateRevenueMetrics(xuatKhoData) {
  const tongDoanhThu = xuatKhoData.reduce((sum, xuat) => 
    sum + xuat.ChiTietXuats.reduce((ctSum, ct) => ctSum + (ct.SoLuong * ct.GiaXuat), 0), 0);
  
  const tongSoLuong = xuatKhoData.reduce((sum, xuat) => 
    sum + xuat.ChiTietXuats.reduce((ctSum, ct) => ctSum + ct.SoLuong, 0), 0);
  
  const soPhieuXuat = xuatKhoData.length;
  const doanhThuTrungBinh = soPhieuXuat > 0 ? tongDoanhThu / soPhieuXuat : 0;
  
  return {
    tongDoanhThu,
    tongSoLuong,
    soPhieuXuat,
    doanhThuTrungBinh,
    doanhThuTrungBinhSanPham: tongSoLuong > 0 ? tongDoanhThu / tongSoLuong : 0
  };
}

function calculateRevenueTrends(xuatKhoData) {
  const daily = {};
  const weekly = {};
  const monthly = {};
  
  xuatKhoData.forEach(xuat => {
    const date = new Date(xuat.NgayXuat);
    const dayKey = date.toISOString().split('T')[0];
    const weekKey = getWeekKey(date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const doanhThu = xuat.ChiTietXuats.reduce((sum, ct) => sum + (ct.SoLuong * ct.GiaXuat), 0);
    
    // Daily
    if (!daily[dayKey]) daily[dayKey] = { period: dayKey, doanhThu: 0, soPhieu: 0 };
    daily[dayKey].doanhThu += doanhThu;
    daily[dayKey].soPhieu += 1;
    
    // Weekly
    if (!weekly[weekKey]) weekly[weekKey] = { period: weekKey, doanhThu: 0, soPhieu: 0 };
    weekly[weekKey].doanhThu += doanhThu;
    weekly[weekKey].soPhieu += 1;
    
    // Monthly
    if (!monthly[monthKey]) monthly[monthKey] = { period: monthKey, doanhThu: 0, soPhieu: 0 };
    monthly[monthKey].doanhThu += doanhThu;
    monthly[monthKey].soPhieu += 1;
  });
  
  return {
    daily: Object.values(daily).sort((a, b) => a.period.localeCompare(b.period)),
    weekly: Object.values(weekly).sort((a, b) => a.period.localeCompare(b.period)),
    monthly: Object.values(monthly).sort((a, b) => a.period.localeCompare(b.period))
  };
}

function calculateTopPerformers(xuatKhoData) {
  const sanPhamStats = {};
  const khoStats = {};
  
  xuatKhoData.forEach(xuat => {
    // Kho stats
    const maKho = xuat.MaKho;
    const tenKho = xuat.KhoHang.TenKho;
    
    if (!khoStats[maKho]) {
      khoStats[maKho] = { maKho, tenKho, doanhThu: 0, soPhieu: 0 };
    }
    
    const doanhThu = xuat.ChiTietXuats.reduce((sum, ct) => sum + (ct.SoLuong * ct.GiaXuat), 0);
    khoStats[maKho].doanhThu += doanhThu;
    khoStats[maKho].soPhieu += 1;
    
    // Sản phẩm stats
    xuat.ChiTietXuats.forEach(ct => {
      const maSP = ct.MaSP;
      const tenSP = ct.SanPham.TenSP;
      
      if (!sanPhamStats[maSP]) {
        sanPhamStats[maSP] = { maSP, tenSP, doanhThu: 0, soLuong: 0 };
      }
      
      const spDoanhThu = ct.SoLuong * ct.GiaXuat;
      sanPhamStats[maSP].doanhThu += spDoanhThu;
      sanPhamStats[maSP].soLuong += ct.SoLuong;
    });
  });
  
  return {
    topKho: Object.values(khoStats).sort((a, b) => b.doanhThu - a.doanhThu).slice(0, 10),
    topSanPham: Object.values(sanPhamStats).sort((a, b) => b.doanhThu - a.doanhThu).slice(0, 10)
  };
}

function calculatePeriodRevenue(data) {
  const tongDoanhThu = data.reduce((sum, xuat) => 
    sum + xuat.ChiTietXuats.reduce((ctSum, ct) => ctSum + (ct.SoLuong * ct.GiaXuat), 0), 0);
  
  const tongSoLuong = data.reduce((sum, xuat) => 
    sum + xuat.ChiTietXuats.reduce((ctSum, ct) => ctSum + ct.SoLuong, 0), 0);
  
  return {
    tongDoanhThu,
    tongSoLuong,
    soPhieuXuat: data.length,
    doanhThuTrungBinh: data.length > 0 ? tongDoanhThu / data.length : 0
  };
}

function getWeekKey(date) {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  return weekStart.toISOString().split('T')[0];
}

module.exports = {
  getDoanhThuTheoThoiGian,
  getDoanhThuTheoSanPham,
  getDoanhThuTheoKho,
  getBaoCaoDoanhThu,
  getDoanhThuRealTime
};
