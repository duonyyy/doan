const EventEmitter = require('events');
const { getDbConnection } = require('../config/db.config');
const { TonKho, SanPham, KhoHang, NhapKho, XuatKho, ChiTietNhap, ChiTietXuat } = require('../models');

class InventoryAnalytics extends EventEmitter {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  /**
   * Lấy báo cáo tổng quan tồn kho
   */
  async getInventorySummary(maKhuVuc = null, maKho = null) {
    try {
      const cacheKey = `summary-${maKhuVuc || 'all'}-${maKho || 'all'}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      let whereClause = {};
      let includeClause = [];

      if (maKho) {
        whereClause.MaKho = maKho;
      } else if (maKhuVuc) {
        includeClause = [{
          model: KhoHang,
          as: 'KhoHang',
          where: { MaKhuVuc: maKhuVuc }
        }];
      }

      // Lấy dữ liệu từ shard tương ứng
      const connection = getDbConnection(maKhuVuc, false, false);
      const tonKhoData = await connection.models.TonKho.findAll({
        where: whereClause,
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
          },
          {
            model: KhoHang,
            as: 'KhoHang',
            include: [
              {
                model: require('../models').KhuVuc,
                as: 'KhuVuc'
              }
            ]
          },
          ...includeClause
        ]
      });

      // Tính toán thống kê
      const summary = this.calculateInventorySummary(tonKhoData);
      
      // Cache kết quả
      this.setCachedData(cacheKey, summary);
      
      return summary;
    } catch (error) {
      console.error('Error getting inventory summary:', error);
      throw error;
    }
  }

  /**
   * Lấy báo cáo chi tiết tồn kho
   */
  async getDetailedInventory(maKhuVuc = null, maKho = null) {
    try {
      const cacheKey = `detailed-${maKhuVuc || 'all'}-${maKho || 'all'}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      let whereClause = {};
      let includeClause = [];

      if (maKho) {
        whereClause.MaKho = maKho;
      } else if (maKhuVuc) {
        includeClause = [{
          model: KhoHang,
          as: 'KhoHang',
          where: { MaKhuVuc: maKhuVuc }
        }];
      }

      const connection = getDbConnection(maKhuVuc, false, false);
      const tonKhoData = await connection.models.TonKho.findAll({
        where: whereClause,
        include: [
          {
            model: SanPham,
            as: 'SanPham'
          },
          {
            model: KhoHang,
            as: 'KhoHang',
            include: [
              {
                model: require('../models').KhuVuc,
                as: 'KhuVuc'
              }
            ]
          },
          ...includeClause
        ],
        order: [['SoLuongTon', 'DESC']]
      });

      // Thêm thông tin xu hướng
      const detailedData = await this.addTrendData(tonKhoData, maKhuVuc);
      
      this.setCachedData(cacheKey, detailedData);
      return detailedData;
    } catch (error) {
      console.error('Error getting detailed inventory:', error);
      throw error;
    }
  }

  /**
   * Lấy xu hướng tồn kho theo thời gian
   */
  async getInventoryTrends(maKhuVuc = null, maKho = null) {
    try {
      const cacheKey = `trends-${maKhuVuc || 'all'}-${maKho || 'all'}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const connection = getDbConnection(maKhuVuc, false, false);
      
      // Lấy dữ liệu nhập kho 30 ngày gần nhất
      const nhapKhoData = await connection.models.NhapKho.findAll({
        where: {
          NgayNhap: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          },
          ...(maKho && { MaKho: maKho })
        },
        include: [
          {
            model: ChiTietNhap,
            as: 'ChiTietNhaps',
            include: [
              {
                model: SanPham,
                as: 'SanPham'
              }
            ]
          }
        ],
        order: [['NgayNhap', 'ASC']]
      });

      // Lấy dữ liệu xuất kho 30 ngày gần nhất
      const xuatKhoData = await connection.models.XuatKho.findAll({
        where: {
          NgayXuat: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          },
          ...(maKho && { MaKho: maKho })
        },
        include: [
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

      const trends = this.calculateTrends(nhapKhoData, xuatKhoData);
      
      this.setCachedData(cacheKey, trends);
      return trends;
    } catch (error) {
      console.error('Error getting inventory trends:', error);
      throw error;
    }
  }

  /**
   * Lấy cảnh báo tồn kho
   */
  async getInventoryAlerts(maKhuVuc = null, maKho = null) {
    try {
      const connection = getDbConnection(maKhuVuc, false, false);
      
      // Tồn kho thấp (<= 10)
      const lowStock = await connection.models.TonKho.findAll({
        where: {
          SoLuongTon: {
            [require('sequelize').Op.lte]: 10
          },
          ...(maKho && { MaKho: maKho })
        },
        include: [
          {
            model: SanPham,
            as: 'SanPham'
          },
          {
            model: KhoHang,
            as: 'KhoHang'
          }
        ]
      });

      // Hết hàng (= 0)
      const outOfStock = await connection.models.TonKho.findAll({
        where: {
          SoLuongTon: 0,
          ...(maKho && { MaKho: maKho })
        },
        include: [
          {
            model: SanPham,
            as: 'SanPham'
          },
          {
            model: KhoHang,
            as: 'KhoHang'
          }
        ]
      });

      // Tồn kho cao (>= 1000)
      const highStock = await connection.models.TonKho.findAll({
        where: {
          SoLuongTon: {
            [require('sequelize').Op.gte]: 1000
          },
          ...(maKho && { MaKho: maKho })
        },
        include: [
          {
            model: SanPham,
            as: 'SanPham'
          },
          {
            model: KhoHang,
            as: 'KhoHang'
          }
        ]
      });

      const alerts = {
        lowStock: lowStock.map(item => ({
          type: 'low-stock',
          severity: 'warning',
          message: `Tồn kho thấp: ${item.SanPham.TenSP} (${item.SoLuongTon} ${item.SanPham.DonVi})`,
          data: item
        })),
        outOfStock: outOfStock.map(item => ({
          type: 'out-of-stock',
          severity: 'critical',
          message: `Hết hàng: ${item.SanPham.TenSP}`,
          data: item
        })),
        highStock: highStock.map(item => ({
          type: 'high-stock',
          severity: 'info',
          message: `Tồn kho cao: ${item.SanPham.TenSP} (${item.SoLuongTon} ${item.SanPham.DonVi})`,
          data: item
        }))
      };

      return alerts;
    } catch (error) {
      console.error('Error getting inventory alerts:', error);
      throw error;
    }
  }

  /**
   * Tính toán thống kê tổng quan
   */
  calculateInventorySummary(tonKhoData) {
    const totalProducts = tonKhoData.length;
    const totalQuantity = tonKhoData.reduce((sum, item) => sum + item.SoLuongTon, 0);
    const totalValue = tonKhoData.reduce((sum, item) => {
      // Giả sử có giá trung bình, thực tế cần tính từ lịch sử giao dịch
      return sum + (item.SoLuongTon * 50000); // 50k VND per unit
    }, 0);

    const lowStockCount = tonKhoData.filter(item => item.SoLuongTon <= 10).length;
    const outOfStockCount = tonKhoData.filter(item => item.SoLuongTon === 0).length;
    const highStockCount = tonKhoData.filter(item => item.SoLuongTon >= 1000).length;

    // Group by warehouse
    const warehouseSummary = tonKhoData.reduce((acc, item) => {
      const warehouseName = item.KhoHang.TenKho;
      if (!acc[warehouseName]) {
        acc[warehouseName] = {
          totalProducts: 0,
          totalQuantity: 0,
          totalValue: 0,
          lowStockItems: 0,
          outOfStockItems: 0
        };
      }
      acc[warehouseName].totalProducts++;
      acc[warehouseName].totalQuantity += item.SoLuongTon;
      acc[warehouseName].totalValue += (item.SoLuongTon * 50000);
      if (item.SoLuongTon <= 10) acc[warehouseName].lowStockItems++;
      if (item.SoLuongTon === 0) acc[warehouseName].outOfStockItems++;
      return acc;
    }, {});

    return {
      summary: {
        totalProducts,
        totalQuantity,
        totalValue,
        lowStockCount,
        outOfStockCount,
        highStockCount
      },
      warehouseSummary,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Thêm dữ liệu xu hướng
   */
  async addTrendData(tonKhoData, maKhuVuc) {
    const connection = getDbConnection(maKhuVuc, false, false);
    
    for (const item of tonKhoData) {
      // Lấy dữ liệu 7 ngày gần nhất
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const recentNhap = await connection.models.ChiTietNhap.sum('SoLuong', {
        where: {
          MaSP: item.MaSP,
          MaNhap: {
            [require('sequelize').Op.in]: await connection.models.NhapKho.findAll({
              where: {
                MaKho: item.MaKho,
                NgayNhap: { [require('sequelize').Op.gte]: sevenDaysAgo }
              },
              attributes: ['MaNhap']
            }).then(results => results.map(r => r.MaNhap))
          }
        }
      });

      const recentXuat = await connection.models.ChiTietXuat.sum('SoLuong', {
        where: {
          MaSP: item.MaSP,
          MaXuat: {
            [require('sequelize').Op.in]: await connection.models.XuatKho.findAll({
              where: {
                MaKho: item.MaKho,
                NgayXuat: { [require('sequelize').Op.gte]: sevenDaysAgo }
              },
              attributes: ['MaXuat']
            }).then(results => results.map(r => r.MaXuat))
          }
        }
      });

      item.trend = {
        recentNhap: recentNhap || 0,
        recentXuat: recentXuat || 0,
        netChange: (recentNhap || 0) - (recentXuat || 0),
        trend: (recentNhap || 0) > (recentXuat || 0) ? 'increasing' : 
               (recentNhap || 0) < (recentXuat || 0) ? 'decreasing' : 'stable'
      };
    }

    return tonKhoData;
  }

  /**
   * Tính toán xu hướng
   */
  calculateTrends(nhapKhoData, xuatKhoData) {
    const dailyData = {};
    
    // Process nhập kho
    nhapKhoData.forEach(nhap => {
      const date = nhap.NgayNhap.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { nhap: 0, xuat: 0, ton: 0 };
      }
      nhap.ChiTietNhaps.forEach(chiTiet => {
        dailyData[date].nhap += chiTiet.SoLuong;
      });
    });

    // Process xuất kho
    xuatKhoData.forEach(xuat => {
      const date = xuat.NgayXuat.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { nhap: 0, xuat: 0, ton: 0 };
      }
      xuat.ChiTietXuats.forEach(chiTiet => {
        dailyData[date].xuat += chiTiet.SoLuong;
      });
    });

    // Calculate running total
    let runningTotal = 0;
    const sortedDates = Object.keys(dailyData).sort();
    sortedDates.forEach(date => {
      runningTotal += dailyData[date].nhap - dailyData[date].xuat;
      dailyData[date].ton = runningTotal;
    });

    return {
      dailyTrends: dailyData,
      summary: {
        totalNhap: Object.values(dailyData).reduce((sum, day) => sum + day.nhap, 0),
        totalXuat: Object.values(dailyData).reduce((sum, day) => sum + day.xuat, 0),
        netChange: runningTotal
      }
    };
  }

  /**
   * Cache management
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = InventoryAnalytics;
