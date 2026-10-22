export function notImplemented(req, res) {
  res.status(501).json({
    message: 'Endpoint registrado, pendiente de implementar',
    method: req.method,
    path: req.originalUrl
  });
}