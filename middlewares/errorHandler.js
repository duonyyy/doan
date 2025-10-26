// Middleware xử lý lỗi chung
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Lỗi validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: err.errors
    });
  }

  // Lỗi Sequelize
  if (err.name === 'SequelizeError') {
    return res.status(500).json({
      success: false,
      message: 'Lỗi cơ sở dữ liệu',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Lỗi hệ thống'
    });
  }

  // Lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token đã hết hạn'
    });
  }

  // Lỗi mặc định
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi hệ thống',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// Middleware xử lý route không tồn tại
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} không tồn tại`
  });
};

// Middleware log request
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  requestLogger
};
