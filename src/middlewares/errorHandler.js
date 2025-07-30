import APIError from '../utils/apiError.js';

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.name === 'CastError') {
    const message = 'Resource not found. Invalid: ' + err.path;
    error = new APIError(400, message);
  }

  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new APIError(400, message);
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new APIError(400, message);
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'JSON Web Token is invalid. Try Again!';
    error = new APIError(401, message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'JSON Web Token is expired. Try Again!';
    error = new APIError(401, message);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

export default errorHandler; 