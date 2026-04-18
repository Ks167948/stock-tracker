const errorHandler = (err, req, res, next) => {
  console.error(`❌ Error: ${err.message}`);
  console.error(err.stack);

  // Mongoose: duplicate key (e.g. email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // Mongoose: validation error (e.g. required field missing)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages,
    });
  }

  // Mongoose: invalid ObjectId (e.g. /api/users/abc instead of a real id)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format`,
    });
  }

  // Default: unknown server error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;