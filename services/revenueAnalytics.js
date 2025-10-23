const { getDbConnection } = require('../config/db.config');
const { Op } = require('sequelize');

class RevenueAnalytics {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  /**
   * Phân tích xu hướng doanh thu
   */
  async analyzeRevenueTrends(maKhuVuc = null, fromDate, toDate) {
    try {
      const cacheKey = `trends-${maKhuVuc || 'all'}-${fromDate}-${toDate}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const connection = getDbConnection(maKhuVuc, false, false);
      
      // Lấy dữ liệu xuất kho
      const xuatKhoData = await connection.models.XuatKho.findAll({
        where: {
          NgayXuat: {
            [Op.between]: [fromDate, toDate]
          }
        },
        include: [
          {
            model: require('../models').ChiTietXuat,
            as: 'ChiTietXuats',
            include: [
              {
                model: require('../models').SanPham,
                as: 'SanPham'
              }
            ]
          }
        ],
        order: [['NgayXuat', 'ASC']]
      });

      // Phân tích xu hướng
      const trends = this.calculateTrends(xuatKhoData);
      
      this.setCachedData(cacheKey, trends);
      return trends;
    } catch (error) {
      console.error('Error analyzing revenue trends:', error);
      throw error;
    }
  }

  /**
   * Phân tích hiệu suất sản phẩm
   */
  async analyzeProductPerformance(maKhuVuc = null, fromDate, toDate) {
    try {
      const connection = getDbConnection(maKhuVuc, false, false);
      
      const xuatKhoData = await connection.models.XuatKho.findAll({
        where: {
          NgayXuat: {
            [Op.between]: [fromDate, toDate]
          }
        },
        include: [
          {
            model: require('../models').ChiTietXuat,
            as: 'ChiTietXuats',
            include: [
              {
                model: require('../models').SanPham,
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
        ]
      });

      // Phân tích hiệu suất
      const performance = this.calculateProductPerformance(xuatKhoData);
      return performance;
    } catch (error) {
      console.error('Error analyzing product performance:', error);
      throw error;
    }
  }

  /**
   * Phân tích hiệu suất kho
   */
  async analyzeWarehousePerformance(maKhuVuc = null, fromDate, toDate) {
    try {
      const connection = getDbConnection(maKhuVuc, false, false);
      
      const xuatKhoData = await connection.models.XuatKho.findAll({
        where: {
          NgayXuat: {
            [Op.between]: [fromDate, toDate]
          }
        },
        include: [
          {
            model: require('../models').KhoHang,
            as: 'KhoHang',
            include: [
              {
                model: require('../models').KhuVuc,
                as: 'KhuVuc'
              }
            ]
          },
          {
            model: require('../models').ChiTietXuat,
            as: 'ChiTietXuats'
          }
        ]
      });

      // Phân tích hiệu suất kho
      const performance = this.calculateWarehousePerformance(xuatKhoData);
      return performance;
    } catch (error) {
      console.error('Error analyzing warehouse performance:', error);
      throw error;
    }
  }

  /**
   * Dự báo doanh thu
   */
  async forecastRevenue(maKhuVuc = null, forecastDays = 30) {
    try {
      const connection = getDbConnection(maKhuVuc, false, false);
      
      // Lấy dữ liệu 90 ngày gần nhất
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const historicalData = await connection.models.XuatKho.findAll({
        where: {
          NgayXuat: {
            [Op.gte]: ninetyDaysAgo
          }
        },
        include: [
          {
            model: require('../models').ChiTietXuat,
            as: 'ChiTietXuats'
          }
        ],
        order: [['NgayXuat', 'ASC']]
      });

      // Tính toán dự báo
      const forecast = this.calculateForecast(historicalData, forecastDays);
      return forecast;
    } catch (error) {
      console.error('Error forecasting revenue:', error);
      throw error;
    }
  }

  /**
   * Phân tích mùa vụ
   */
  async analyzeSeasonality(maKhuVuc = null, years = 2) {
    try {
      const connection = getDbConnection(maKhuVuc, false, false);
      
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - years);
      
      const xuatKhoData = await connection.models.XuatKho.findAll({
        where: {
          NgayXuat: {
            [Op.gte]: startDate
          }
        },
        include: [
          {
            model: require('../models').ChiTietXuat,
            as: 'ChiTietXuats'
          }
        ],
        order: [['NgayXuat', 'ASC']]
      });

      // Phân tích mùa vụ
      const seasonality = this.calculateSeasonality(xuatKhoData);
      return seasonality;
    } catch (error) {
      console.error('Error analyzing seasonality:', error);
      throw error;
    }
  }

  /**
   * Tính toán xu hướng
   */
  calculateTrends(xuatKhoData) {
    const dailyData = {};
    const weeklyData = {};
    const monthlyData = {};
    
    xuatKhoData.forEach(xuat => {
      const date = new Date(xuat.NgayXuat);
      const dayKey = date.toISOString().split('T')[0];
      const weekKey = this.getWeekKey(date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const doanhThu = xuat.ChiTietXuats.reduce((sum, ct) => sum + (ct.SoLuong * ct.GiaXuat), 0);
      
      // Daily
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = { date: dayKey, doanhThu: 0, soPhieu: 0 };
      }
      dailyData[dayKey].doanhThu += doanhThu;
      dailyData[dayKey].soPhieu += 1;
      
      // Weekly
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { week: weekKey, doanhThu: 0, soPhieu: 0 };
      }
      weeklyData[weekKey].doanhThu += doanhThu;
      weeklyData[weekKey].soPhieu += 1;
      
      // Monthly
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, doanhThu: 0, soPhieu: 0 };
      }
      monthlyData[monthKey].doanhThu += doanhThu;
      monthlyData[monthKey].soPhieu += 1;
    });
    
    // Tính toán growth rate
    const dailyGrowth = this.calculateGrowthRate(Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)));
    const weeklyGrowth = this.calculateGrowthRate(Object.values(weeklyData).sort((a, b) => a.week.localeCompare(b.week)));
    const monthlyGrowth = this.calculateGrowthRate(Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)));
    
    return {
      daily: {
        data: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
        growthRate: dailyGrowth
      },
      weekly: {
        data: Object.values(weeklyData).sort((a, b) => a.week.localeCompare(b.week)),
        growthRate: weeklyGrowth
      },
      monthly: {
        data: Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)),
        growthRate: monthlyGrowth
      }
    };
  }

  /**
   * Tính toán hiệu suất sản phẩm
   */
  calculateProductPerformance(xuatKhoData) {
    const productStats = {};
    
    xuatKhoData.forEach(xuat => {
      xuat.ChiTietXuats.forEach(ct => {
        const maSP = ct.MaSP;
        const tenSP = ct.SanPham.TenSP;
        
        if (!productStats[maSP]) {
          productStats[maSP] = {
            maSP,
            tenSP,
            donVi: ct.SanPham.DonVi,
            nhaCungCap: ct.SanPham.NhaCungCap?.TenNCC,
            tongDoanhThu: 0,
            tongSoLuong: 0,
            soLanXuat: 0,
            giaTrungBinh: 0,
            doanhThuTrungBinh: 0,
            chiTiet: []
          };
        }
        
        const doanhThu = ct.SoLuong * ct.GiaXuat;
        productStats[maSP].tongDoanhThu += doanhThu;
        productStats[maSP].tongSoLuong += ct.SoLuong;
        productStats[maSP].soLanXuat += 1;
        
        productStats[maSP].chiTiet.push({
          ngayXuat: xuat.NgayXuat,
          soLuong: ct.SoLuong,
          giaXuat: ct.GiaXuat,
          doanhThu
        });
      });
    });
    
    // Tính toán metrics
    Object.values(productStats).forEach(sp => {
      sp.giaTrungBinh = sp.tongSoLuong > 0 ? sp.tongDoanhThu / sp.tongSoLuong : 0;
      sp.doanhThuTrungBinh = sp.soLanXuat > 0 ? sp.tongDoanhThu / sp.soLanXuat : 0;
    });
    
    // Phân loại sản phẩm
    const sortedProducts = Object.values(productStats).sort((a, b) => b.tongDoanhThu - a.tongDoanhThu);
    const totalRevenue = sortedProducts.reduce((sum, sp) => sum + sp.tongDoanhThu, 0);
    
    const categories = {
      topPerformers: sortedProducts.slice(0, Math.ceil(sortedProducts.length * 0.2)), // Top 20%
      averagePerformers: sortedProducts.slice(
        Math.ceil(sortedProducts.length * 0.2), 
        Math.ceil(sortedProducts.length * 0.8)
      ), // 20% - 80%
      lowPerformers: sortedProducts.slice(Math.ceil(sortedProducts.length * 0.8)) // Bottom 20%
    };
    
    return {
      summary: {
        totalProducts: sortedProducts.length,
        totalRevenue,
        averageRevenuePerProduct: sortedProducts.length > 0 ? totalRevenue / sortedProducts.length : 0
      },
      categories,
      allProducts: sortedProducts
    };
  }

  /**
   * Tính toán hiệu suất kho
   */
  calculateWarehousePerformance(xuatKhoData) {
    const warehouseStats = {};
    
    xuatKhoData.forEach(xuat => {
      const maKho = xuat.MaKho;
      const tenKho = xuat.KhoHang.TenKho;
      const khuVuc = xuat.KhoHang.KhuVuc?.TenKhuVuc;
      
      if (!warehouseStats[maKho]) {
        warehouseStats[maKho] = {
          maKho,
          tenKho,
          khuVuc,
          tongDoanhThu: 0,
          tongSoLuong: 0,
          soPhieuXuat: 0,
          soSanPham: new Set(),
          doanhThuTrungBinh: 0,
          chiTiet: []
        };
      }
      
      const doanhThu = xuat.ChiTietXuats.reduce((sum, ct) => sum + (ct.SoLuong * ct.GiaXuat), 0);
      const soLuong = xuat.ChiTietXuats.reduce((sum, ct) => sum + ct.SoLuong, 0);
      
      warehouseStats[maKho].tongDoanhThu += doanhThu;
      warehouseStats[maKho].tongSoLuong += soLuong;
      warehouseStats[maKho].soPhieuXuat += 1;
      
      xuat.ChiTietXuats.forEach(ct => {
        warehouseStats[maKho].soSanPham.add(ct.MaSP);
      });
      
      warehouseStats[maKho].chiTiet.push({
        ngayXuat: xuat.NgayXuat,
        doanhThu,
        soLuong,
        soSanPham: xuat.ChiTietXuats.length
      });
    });
    
    // Tính toán metrics
    Object.values(warehouseStats).forEach(kho => {
      kho.soSanPham = kho.soSanPham.size;
      kho.doanhThuTrungBinh = kho.soPhieuXuat > 0 ? kho.tongDoanhThu / kho.soPhieuXuat : 0;
    });
    
    // Sắp xếp theo doanh thu
    const sortedWarehouses = Object.values(warehouseStats).sort((a, b) => b.tongDoanhThu - a.tongDoanhThu);
    
    return {
      summary: {
        totalWarehouses: sortedWarehouses.length,
        totalRevenue: sortedWarehouses.reduce((sum, kho) => sum + kho.tongDoanhThu, 0),
        averageRevenuePerWarehouse: sortedWarehouses.length > 0 ? 
          sortedWarehouses.reduce((sum, kho) => sum + kho.tongDoanhThu, 0) / sortedWarehouses.length : 0
      },
      warehouses: sortedWarehouses
    };
  }

  /**
   * Tính toán dự báo
   */
  calculateForecast(historicalData, forecastDays) {
    // Group by day
    const dailyData = {};
    
    historicalData.forEach(xuat => {
      const dayKey = xuat.NgayXuat.toISOString().split('T')[0];
      const doanhThu = xuat.ChiTietXuats.reduce((sum, ct) => sum + (ct.SoLuong * ct.GiaXuat), 0);
      
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = { date: dayKey, doanhThu: 0, soPhieu: 0 };
      }
      dailyData[dayKey].doanhThu += doanhThu;
      dailyData[dayKey].soPhieu += 1;
    });
    
    const sortedData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
    
    // Simple moving average forecast
    const windowSize = 7; // 7 days
    const forecast = [];
    
    if (sortedData.length >= windowSize) {
      const recentData = sortedData.slice(-windowSize);
      const averageRevenue = recentData.reduce((sum, day) => sum + day.doanhThu, 0) / windowSize;
      
      for (let i = 1; i <= forecastDays; i++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + i);
        
        forecast.push({
          date: forecastDate.toISOString().split('T')[0],
          predictedRevenue: averageRevenue,
          confidence: Math.max(0.1, 1 - (i * 0.05)) // Confidence decreases over time
        });
      }
    }
    
    return {
      forecast,
      historicalData: sortedData.slice(-30), // Last 30 days
      accuracy: this.calculateForecastAccuracy(sortedData, windowSize)
    };
  }

  /**
   * Tính toán mùa vụ
   */
  calculateSeasonality(xuatKhoData) {
    const monthlyData = {};
    const quarterlyData = {};
    
    xuatKhoData.forEach(xuat => {
      const date = new Date(xuat.NgayXuat);
      const monthKey = date.getMonth() + 1;
      const quarterKey = Math.ceil((date.getMonth() + 1) / 3);
      
      const doanhThu = xuat.ChiTietXuats.reduce((sum, ct) => sum + (ct.SoLuong * ct.GiaXuat), 0);
      
      // Monthly
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, totalRevenue: 0, count: 0 };
      }
      monthlyData[monthKey].totalRevenue += doanhThu;
      monthlyData[monthKey].count += 1;
      
      // Quarterly
      if (!quarterlyData[quarterKey]) {
        quarterlyData[quarterKey] = { quarter: quarterKey, totalRevenue: 0, count: 0 };
      }
      quarterlyData[quarterKey].totalRevenue += doanhThu;
      quarterlyData[quarterKey].count += 1;
    });
    
    // Calculate averages
    Object.values(monthlyData).forEach(month => {
      month.averageRevenue = month.count > 0 ? month.totalRevenue / month.count : 0;
    });
    
    Object.values(quarterlyData).forEach(quarter => {
      quarter.averageRevenue = quarter.count > 0 ? quarter.totalRevenue / quarter.count : 0;
    });
    
    return {
      monthly: Object.values(monthlyData).sort((a, b) => a.month - b.month),
      quarterly: Object.values(quarterlyData).sort((a, b) => a.quarter - b.quarter)
    };
  }

  /**
   * Tính toán growth rate
   */
  calculateGrowthRate(data) {
    if (data.length < 2) return 0;
    
    const firstValue = data[0].doanhThu;
    const lastValue = data[data.length - 1].doanhThu;
    
    if (firstValue === 0) return 0;
    
    return ((lastValue - firstValue) / firstValue) * 100;
  }

  /**
   * Tính toán độ chính xác dự báo
   */
  calculateForecastAccuracy(data, windowSize) {
    if (data.length < windowSize * 2) return 0;
    
    const testData = data.slice(-windowSize);
    const historicalData = data.slice(-windowSize * 2, -windowSize);
    
    const historicalAverage = historicalData.reduce((sum, day) => sum + day.doanhThu, 0) / historicalData.length;
    const actualAverage = testData.reduce((sum, day) => sum + day.doanhThu, 0) / testData.length;
    
    const error = Math.abs(historicalAverage - actualAverage) / actualAverage;
    return Math.max(0, 1 - error);
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

  getWeekKey(date) {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().split('T')[0];
  }
}

module.exports = RevenueAnalytics;
