const { logError } = require("../shared/logger");

function errorMiddleware(err, req, res, next) {
  logError("Unhandled error", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
}

module.exports = errorMiddleware;
