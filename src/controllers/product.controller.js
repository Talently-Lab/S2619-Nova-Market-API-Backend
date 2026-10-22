
export function getProducts(req, res) {
  res.json({
    message: 'Listado de productos'
  });
}

export function getProduct(req, res) {
  res.json({
    message: 'Detalle del producto',
    code: req.params.code
  });
}
