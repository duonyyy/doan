const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { testConnections } = require('./config/db.config');

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Serve client demo
app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/socket/client-demo.html');
});

// Initialize Socket.IO
const socketServer = new SocketServer(server);
const realtimeReports = new RealtimeReports(socketServer);

// Make socketServer available globally for controllers
global.socketServer = socketServer;

// Test database connections
testConnections();

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🔌 Socket.IO ready for real-time connections`);
  console.log(`📊 Real-time inventory reports enabled`);
});