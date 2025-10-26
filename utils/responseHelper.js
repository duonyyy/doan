// Utility functions for API responses
const sendSuccess = (res, data = null, message = 'Thành công', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

const sendError = (res, message = 'Lỗi hệ thống', statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (error && process.env.NODE_ENV === 'development') {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Dữ liệu không hợp lệ',
    errors,
    timestamp: new Date().toISOString()
  });
};

const sendNotFound = (res, message = 'Không tìm thấy dữ liệu') => {
  return res.status(404).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

const sendUnauthorized = (res, message = 'Không có quyền truy cập') => {
  return res.status(401).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

// Pagination helper
const createPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null
  };
};

// Database query helper
const executeQuery = async (dbConnection, query, replacements = {}) => {
  try {
    const results = await dbConnection.query(query, {
      replacements,
      type: dbConnection.QueryTypes.SELECT
    });
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Validate required fields
const validateRequired = (data, requiredFields) => {
  const missing = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }
  
  return missing;
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  createPagination,
  executeQuery,
  validateRequired
};
