const { getDbConnection } = require('../config/db.config');
const { TonKho, SanPham, KhoHang, NhapKho, XuatKho } = require('../models');

class RealtimeReports {
  constructor(socketServer) {
    this.socketServer = socketServer;
    this.setupRealtimeMonitoring();
  }

  /**
   * Setup real-time monitoring
   */
  setupRealtimeMonitoring() {
    // Monitor inventory changes every 30 seconds
    setInterval(() => {
      this.checkInventoryChanges();
    }, 30000);

    // Monitor transaction updates every 10 seconds
    setInterval(() => {
      this.checkTransactionUpdates();
    }, 10000);

    // Monitor alerts every 60 seconds
    setInterval(() => {
      this.checkAlerts();
    }, 60000);
  }

  /**
   * Check for inventory changes
   */
  async checkInventoryChanges() {
    try {
      // Check all shards for inventory changes
      const shards = [1, 2, 3, 4];
      
      for (const maKhuVuc of shards) {
        const connection = getDbConnection(maKhuVuc, false, false);
        
        // Get current inventory levels
        const currentInventory = await connection.models.TonKho.findAll({
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

        // Check for significant changes
        for (const item of currentInventory) {
          // Low stock alert
          if (item.SoLuongTon <= 10 && item.SoLuongTon > 0) {
            this.socketServer.broadcastAlert(
              maKhuVuc,
              item.MaKho,
              'low-stock',
              `Tồn kho thấp: ${item.SanPham.TenSP} (${item.SoLuongTon} ${item.SanPham.DonVi})`
            );
          }

          // Out of stock alert
          if (item.SoLuongTon === 0) {
            this.socketServer.broadcastAlert(
              maKhuVuc,
              item.MaKho,
              'out-of-stock',
              `Hết hàng: ${item.SanPham.TenSP}`
            );
          }

          // High stock alert
          if (item.SoLuongTon >= 1000) {
            this.socketServer.broadcastAlert(
              maKhuVuc,
              item.MaKho,
              'high-stock',
              `Tồn kho cao: ${item.SanPham.TenSP} (${item.SoLuongTon} ${item.SanPham.DonVi})`
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking inventory changes:', error);
    }
  }

  /**
   * Check for transaction updates
   */
  async checkTransactionUpdates() {
    try {
      const shards = [1, 2, 3, 4];
      
      for (const maKhuVuc of shards) {
        const connection = getDbConnection(maKhuVuc, false, false);
        
        // Get recent transactions (last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const recentNhap = await connection.models.NhapKho.findAll({
          where: {
            NgayNhap: {
              [require('sequelize').Op.gte]: fiveMinutesAgo
            }
          },
          include: [
            {
              model: require('../models').ChiTietNhap,
              as: 'ChiTietNhaps',
              include: [
                {
                  model: SanPham,
                  as: 'SanPham'
                }
              ]
            }
          ]
        });

        const recentXuat = await connection.models.XuatKho.findAll({
          where: {
            NgayXuat: {
              [require('sequelize').Op.gte]: fiveMinutesAgo
            }
          },
          include: [
            {
              model: require('../models').ChiTietXuat,
              as: 'ChiTietXuats',
              include: [
                {
                  model: SanPham,
                  as: 'SanPham'
                }
              ]
            }
          ]
        });

        // Broadcast nhập kho updates
        for (const nhap of recentNhap) {
          this.socketServer.broadcastTransactionUpdate(
            maKhuVuc,
            nhap.MaKho,
            'nhap-kho',
            {
              maNhap: nhap.MaNhap,
              ngayNhap: nhap.NgayNhap,
              chiTiet: nhap.ChiTietNhaps.map(ct => ({
                tenSP: ct.SanPham.TenSP,
                soLuong: ct.SoLuong,
                giaNhap: ct.GiaNhap
              }))
            }
          );
        }

        // Broadcast xuất kho updates
        for (const xuat of recentXuat) {
          this.socketServer.broadcastTransactionUpdate(
            maKhuVuc,
            xuat.MaKho,
            'xuat-kho',
            {
              maXuat: xuat.MaXuat,
              ngayXuat: xuat.NgayXuat,
              chiTiet: xuat.ChiTietXuats.map(ct => ({
                tenSP: ct.SanPham.TenSP,
                soLuong: ct.SoLuong,
                giaXuat: ct.GiaXuat
              }))
            }
          );
        }
      }
    } catch (error) {
      console.error('Error checking transaction updates:', error);
    }
  }

  /**
   * Check for alerts
   */
  async checkAlerts() {
    try {
      const shards = [1, 2, 3, 4];
      
      for (const maKhuVuc of shards) {
        const connection = getDbConnection(maKhuVuc, false, false);
        
        // Check for products that haven't been moved in 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const staleInventory = await connection.models.TonKho.findAll({
          where: {
            SoLuongTon: {
              [require('sequelize').Op.gt]: 0
            }
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

        // Check if products have been inactive
        for (const item of staleInventory) {
          const lastTransaction = await this.getLastTransaction(item.MaSP, item.MaKho, maKhuVuc);
          
          if (lastTransaction && lastTransaction.date < thirtyDaysAgo) {
            this.socketServer.broadcastAlert(
              maKhuVuc,
              item.MaKho,
              'stale-inventory',
              `Hàng tồn lâu: ${item.SanPham.TenSP} (${item.SoLuongTon} ${item.SanPham.DonVi}) - Lần cuối giao dịch: ${lastTransaction.date.toLocaleDateString()}`
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  /**
   * Get last transaction for a product
   */
  async getLastTransaction(maSP, maKho, maKhuVuc) {
    try {
      const connection = getDbConnection(maKhuVuc, false, false);
      
      // Check last nhập kho
      const lastNhap = await connection.models.NhapKho.findOne({
        where: { MaKho: maKho },
        include: [
          {
            model: require('../models').ChiTietNhap,
            as: 'ChiTietNhaps',
            where: { MaSP: maSP }
          }
        ],
        order: [['NgayNhap', 'DESC']]
      });

      // Check last xuất kho
      const lastXuat = await connection.models.XuatKho.findOne({
        where: { MaKho: maKho },
        include: [
          {
            model: require('../models').ChiTietXuat,
            as: 'ChiTietXuats',
            where: { MaSP: maSP }
          }
        ],
        order: [['NgayXuat', 'DESC']]
      });

      const lastNhapDate = lastNhap ? lastNhap.NgayNhap : null;
      const lastXuatDate = lastXuat ? lastXuat.NgayXuat : null;

      if (!lastNhapDate && !lastXuatDate) return null;

      const lastDate = lastNhapDate && lastXuatDate ? 
        (lastNhapDate > lastXuatDate ? lastNhapDate : lastXuatDate) :
        (lastNhapDate || lastXuatDate);

      return {
        date: lastDate,
        type: lastNhapDate > lastXuatDate ? 'nhap' : 'xuat'
      };
    } catch (error) {
      console.error('Error getting last transaction:', error);
      return null;
    }
  }

  /**
   * Generate real-time dashboard data
   */
  async generateDashboardData(maKhuVuc = null, maKho = null) {
    try {
      const connection = getDbConnection(maKhuVuc, false, false);
      
      // Get current inventory summary
      const inventorySummary = await connection.models.TonKho.findAll({
        where: maKho ? { MaKho: maKho } : {},
        include: [
          {
            model: SanPham,
            as: 'SanPham'
          },
          {
            model: KhoHang,
            as: 'KhoHang',
            ...(maKhuVuc && { where: { MaKhuVuc: maKhuVuc } })
          }
        ]
      });

      // Get today's transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayNhap = await connection.models.NhapKho.findAll({
        where: {
          NgayNhap: {
            [require('sequelize').Op.gte]: today
          },
          ...(maKho && { MaKho: maKho })
        },
        include: [
          {
            model: require('../models').ChiTietNhap,
            as: 'ChiTietNhaps'
          }
        ]
      });

      const todayXuat = await connection.models.XuatKho.findAll({
        where: {
          NgayXuat: {
            [require('sequelize').Op.gte]: today
          },
          ...(maKho && { MaKho: maKho })
        },
        include: [
          {
            model: require('../models').ChiTietXuat,
            as: 'ChiTietXuats'
          }
        ]
      });

      // Calculate metrics
      const totalProducts = inventorySummary.length;
      const totalQuantity = inventorySummary.reduce((sum, item) => sum + item.SoLuongTon, 0);
      const lowStockItems = inventorySummary.filter(item => item.SoLuongTon <= 10).length;
      const outOfStockItems = inventorySummary.filter(item => item.SoLuongTon === 0).length;

      const todayNhapQuantity = todayNhap.reduce((sum, nhap) => 
        sum + nhap.ChiTietNhaps.reduce((ctSum, ct) => ctSum + ct.SoLuong, 0), 0);
      
      const todayXuatQuantity = todayXuat.reduce((sum, xuat) => 
        sum + xuat.ChiTietXuats.reduce((ctSum, ct) => ctSum + ct.SoLuong, 0), 0);

      return {
        inventory: {
          totalProducts,
          totalQuantity,
          lowStockItems,
          outOfStockItems
        },
        todayTransactions: {
          nhap: {
            count: todayNhap.length,
            quantity: todayNhapQuantity
          },
          xuat: {
            count: todayXuat.length,
            quantity: todayXuatQuantity
          },
          netChange: todayNhapQuantity - todayXuatQuantity
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating dashboard data:', error);
      throw error;
    }
  }

  /**
   * Broadcast dashboard update
   */
  async broadcastDashboardUpdate(maKhuVuc = null, maKho = null) {
    try {
      const dashboardData = await this.generateDashboardData(maKhuVuc, maKho);
      
      if (maKhuVuc) {
        this.socketServer.getIO().to(`khu-vuc-${maKhuVuc}`).emit('dashboard-update', dashboardData);
      }
      
      if (maKho) {
        this.socketServer.getIO().to(`kho-${maKho}`).emit('dashboard-update', dashboardData);
      }
      
      // Broadcast to all if no specific filter
      if (!maKhuVuc && !maKho) {
        this.socketServer.getIO().emit('dashboard-update', dashboardData);
      }
    } catch (error) {
      console.error('Error broadcasting dashboard update:', error);
    }
  }
}

module.exports = RealtimeReports;
