const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { errorHandler, notFoundHandler, requestLogger } = require('./middlewares/errorHandler');

// Import routes
const apiRoutes = require('./routers');

// Import Socket.IO
const SocketServer = require('./socket/socketServer');
const RealtimeReports = require('./socket/realtimeReports');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Routes
app.use('/api', apiRoutes);

// Serve client demo
app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/socket/client-demo.html');
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Socket.IO
const socketServer = new SocketServer(server);
const realtimeReports = new RealtimeReports(socketServer);

// Make socketServer available globally for controllers
global.socketServer = socketServer;

// Skip database connection test for demo
console.log('🔍 Skipping database connection test (demo mode)');
console.log('✅ Server running in demo mode - authentication uses fake data');

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🔌 Socket.IO ready for real-time connections`);
  console.log(`📊 Real-time inventory reports enabled`);
  console.log(`🎯 Demo mode: Using fake data for authentication`);
});
