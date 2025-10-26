const { getDbConnection, masterDb } = require('../config/db.config');

class RealtimeReports {
  constructor(socketServer) {
    this.socketServer = socketServer;
    this.setupRealtimeMonitoring();
  }

  /**
   * Setup real-time monitoring intervals
   */
  setupRealtimeMonitoring() {
    // Check inventory changes every 30 seconds
    setInterval(() => {
      this.checkInventoryChanges();
    }, 30000);

    // Check transaction updates every 10 seconds
    setInterval(() => {
      this.checkTransactionUpdates();
    }, 10000);

    // Check alerts every minute
    setInterval(() => {
      this.checkAlerts();
    }, 60000);
  }

  /**
   * Check for inventory changes (simplified version)
   */
  async checkInventoryChanges() {
    try {
      console.log('📊 Checking inventory changes... (simplified mode)');
      
      // Simulate inventory alerts for demo purposes
      const mockAlerts = [
        {
          region: 'Miền Nam',
          type: 'low_stock',
          message: 'Sản phẩm A tại Kho Tổng TP. HCM sắp hết hàng (5 cái)'
        },
        {
          region: 'Miền Bắc', 
          type: 'normal',
          message: 'Tồn kho Miền Bắc ổn định'
        },
        {
          region: 'Miền Trung',
          type: 'normal', 
          message: 'Tồn kho Miền Trung ổn định'
        }
      ];

      // Broadcast mock alerts (only once per session)
      if (!this.alertsSent) {
        for (const alert of mockAlerts) {
          this.socketServer.broadcastAlert(
            alert.region,
            alert.type,
            alert.message
          );
        }
        this.alertsSent = true;
      }
      
    } catch (error) {
      console.error('Error checking inventory changes:', error);
    }
  }

  /**
   * Check for transaction updates (simplified version)
   */
  async checkTransactionUpdates() {
    try {
      console.log('🔄 Checking transaction updates... (simplified mode)');
      
      // Simulate transaction updates for demo
      const mockTransactions = [
        {
          region: 'Miền Nam',
          type: 'nhap_kho',
          message: 'Nhập kho thành công: 100 sản phẩm A vào Kho Tổng TP. HCM'
        },
        {
          region: 'Miền Bắc',
          type: 'xuat_kho', 
          message: 'Xuất kho thành công: 50 sản phẩm B từ Kho Tổng Hà Nội'
        }
      ];

      // Broadcast mock transactions (only once per session)
      if (!this.transactionsSent) {
        for (const transaction of mockTransactions) {
          this.socketServer.broadcastTransactionUpdate(
            transaction.region,
            transaction.type,
            transaction.message
          );
        }
        this.transactionsSent = true;
      }
      
    } catch (error) {
      console.error('Error checking transaction updates:', error);
    }
  }

  /**
   * Check for system alerts
   */
  async checkAlerts() {
    try {
      console.log('🚨 Checking system alerts... (simplified mode)');
      
      // Simulate system alerts
      const mockSystemAlerts = [
        {
          type: 'system',
          message: 'Hệ thống hoạt động bình thường',
          level: 'info'
        }
      ];

      // Broadcast system alerts (only once per session)
      if (!this.systemAlertsSent) {
        for (const alert of mockSystemAlerts) {
          this.socketServer.broadcastAlert(
            'system',
            alert.type,
            alert.message
          );
        }
        this.systemAlertsSent = true;
      }
      
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  /**
   * Get real-time revenue data (simplified)
   */
  async getRealtimeRevenue() {
    try {
      // Return mock revenue data
      return {
        today: {
          total: 15000000,
          transactions: 25,
          growth: 12.5
        },
        thisWeek: {
          total: 85000000,
          transactions: 150,
          growth: 8.3
        },
        thisMonth: {
          total: 320000000,
          transactions: 650,
          growth: 15.2
        }
      };
    } catch (error) {
      console.error('Error getting realtime revenue:', error);
      return null;
    }
  }

  /**
   * Get inventory summary (simplified)
   */
  async getInventorySummary() {
    try {
      // Return mock inventory summary
      return {
        totalProducts: 150,
        lowStock: 12,
        outOfStock: 3,
        totalValue: 2500000000,
        regions: {
          'Miền Bắc': { products: 50, value: 800000000 },
          'Miền Trung': { products: 45, value: 750000000 },
          'Miền Nam': { products: 55, value: 950000000 }
        }
      };
    } catch (error) {
      console.error('Error getting inventory summary:', error);
      return null;
    }
  }
}

module.exports = RealtimeReports;