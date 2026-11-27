export function notFound(req, _res, next) {
  next(Object.assign(new Error(`Route not found: ${req.method} ${req.originalUrl}`), { status: 404 }));
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status || (error.name === 'ValidationError' || error.name === 'CastError' ? 400 : error.code === 11000 ? 409 : 500);
  const message = error.code === 11000 ? 'A record with that value already exists' : error.message || 'Internal server error';
  res.status(status).json({ success: false, error: { message } });
}
