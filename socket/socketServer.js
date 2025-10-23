const { Server } = require('socket.io');
const InventoryAnalytics = require('./inventoryAnalytics');

class SocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.analytics = new InventoryAnalytics();
    this.setupSocketEvents();
  }

  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log(`📱 Client connected: ${socket.id}`);

      // Client join room để nhận báo cáo theo khu vực
      socket.on('join-room', (data) => {
        const { maKhuVuc, maKho } = data;
        
        if (maKhuVuc) {
          socket.join(`khu-vuc-${maKhuVuc}`);
          console.log(`🏢 Client ${socket.id} joined room: khu-vuc-${maKhuVuc}`);
        }
        
        if (maKho) {
          socket.join(`kho-${maKho}`);
          console.log(`🏪 Client ${socket.id} joined room: kho-${maKho}`);
        }
        
        socket.emit('joined-room', { maKhuVuc, maKho });
      });

      // Client yêu cầu báo cáo tồn kho
      socket.on('get-inventory-report', async (data) => {
        try {
          const { maKhuVuc, maKho, reportType = 'summary' } = data;
          
          let report;
          switch (reportType) {
            case 'summary':
              report = await this.analytics.getInventorySummary(maKhuVuc, maKho);
              break;
            case 'detailed':
              report = await this.analytics.getDetailedInventory(maKhuVuc, maKho);
              break;
            case 'trends':
              report = await this.analytics.getInventoryTrends(maKhuVuc, maKho);
              break;
            case 'alerts':
              report = await this.analytics.getInventoryAlerts(maKhuVuc, maKho);
              break;
            default:
              report = await this.analytics.getInventorySummary(maKhuVuc, maKho);
          }
          
          socket.emit('inventory-report', {
            success: true,
            reportType,
            data: report,
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          socket.emit('inventory-report', {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Client yêu cầu subscribe real-time updates
      socket.on('subscribe-realtime', (data) => {
        const { maKhuVuc, maKho, updateTypes = ['inventory', 'transactions'] } = data;
        
        socket.subscribedTo = {
          maKhuVuc,
          maKho,
          updateTypes
        };
        
        console.log(`📊 Client ${socket.id} subscribed to real-time updates`);
        socket.emit('subscribed', { 
          maKhuVuc, 
          maKho, 
          updateTypes,
          timestamp: new Date().toISOString()
        });
      });

      // Client disconnect
      socket.on('disconnect', () => {
        console.log(`📱 Client disconnected: ${socket.id}`);
      });
    });

    // Broadcast real-time updates
    this.setupRealtimeBroadcasts();
  }

  setupRealtimeBroadcasts() {
    // Broadcast inventory changes
    this.analytics.on('inventory-changed', (data) => {
      const { maKhuVuc, maKho, changeType, details } = data;
      
      // Broadcast to specific room
      if (maKhuVuc) {
        this.io.to(`khu-vuc-${maKhuVuc}`).emit('inventory-update', {
          type: 'inventory-changed',
          maKhuVuc,
          maKho,
          changeType,
          details,
          timestamp: new Date().toISOString()
        });
      }
      
      if (maKho) {
        this.io.to(`kho-${maKho}`).emit('inventory-update', {
          type: 'inventory-changed',
          maKhuVuc,
          maKho,
          changeType,
          details,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Broadcast transaction updates
    this.analytics.on('transaction-updated', (data) => {
      const { maKhuVuc, maKho, transactionType, details } = data;
      
      if (maKhuVuc) {
        this.io.to(`khu-vuc-${maKhuVuc}`).emit('transaction-update', {
          type: 'transaction-updated',
          maKhuVuc,
          maKho,
          transactionType,
          details,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Broadcast alerts
    this.analytics.on('alert-triggered', (data) => {
      const { maKhuVuc, maKho, alertType, message } = data;
      
      if (maKhuVuc) {
        this.io.to(`khu-vuc-${maKhuVuc}`).emit('alert', {
          type: 'alert-triggered',
          maKhuVuc,
          maKho,
          alertType,
          message,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  // Method để trigger updates từ controllers
  broadcastInventoryUpdate(maKhuVuc, maKho, changeType, details) {
    this.analytics.emit('inventory-changed', {
      maKhuVuc,
      maKho,
      changeType,
      details
    });
  }

  broadcastTransactionUpdate(maKhuVuc, maKho, transactionType, details) {
    this.analytics.emit('transaction-updated', {
      maKhuVuc,
      maKho,
      transactionType,
      details
    });
  }

  broadcastAlert(maKhuVuc, maKho, alertType, message) {
    this.analytics.emit('alert-triggered', {
      maKhuVuc,
      maKho,
      alertType,
      message
    });
  }

  getIO() {
    return this.io;
  }
}

module.exports = SocketServer;
