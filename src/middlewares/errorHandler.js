const errorHandler = (err, req, res, next) => {
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'This email is already registered for the event'
    });
  }

  if (err.name === 'CastError') {
    const isIdField = err.path === '_id' || err.kind === 'ObjectId';
    return res.status(400).json({
      success: false,
      message: isIdField ? 'Invalid registration ID format' : `Invalid value for ${err.path}`
    });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: errors.length === 1 ? errors[0] : 'Validation failed',
      errors: errors
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
