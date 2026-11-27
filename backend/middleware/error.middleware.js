export function notFound(req, _res, next) {
  next(Object.assign(new Error(`Route not found: ${req.method} ${req.originalUrl}`), { status: 404 }));
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status || (error.name === 'ValidationError' ? 400 : 500);
  res.status(status).json({ success: false, error: { message: error.message || 'Internal server error' } });
}
