
export function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    error: statusCode === 500
      ? 'Error interno del servidor'
      : err.message
  });
}
