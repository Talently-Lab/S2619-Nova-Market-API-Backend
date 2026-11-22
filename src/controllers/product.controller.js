import {
  listProducts,
  getCategories,
  getProductByCode,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/product.service.js';

// GET /api/products
export async function getProducts(req, res, next) {
  try {
    const result = await listProducts(req.query);
    return res.status(200).json({
      status_code: 200,
      status_description: 'Productos obtenidos correctamente.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/products/categories
export async function getProductCategories(req, res, next) {
  try {
    const result = await getCategories();
    return res.status(200).json({
      status_code: 200,
      status_description: 'Categorías obtenidas correctamente.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/products/:code
export async function getProduct(req, res, next) {
  try {
    const product = await getProductByCode(req.params.code);
    return res.status(200).json({
      status_code: 200,
      status_description: 'Producto obtenido correctamente.',
      product,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/products (Admin)
export async function postProduct(req, res, next) {
  try {
    const product = await createProduct(req.body);
    return res.status(201).json({
      status_code: 201,
      status_description: 'Producto creado correctamente.',
      product,
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/products/:code (Admin)
export async function putProduct(req, res, next) {
  try {
    const product = await updateProduct(req.params.code, req.body);
    return res.status(200).json({
      status_code: 200,
      status_description: 'Producto actualizado correctamente.',
      product,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/products/:code (Admin)
export async function deleteProductHandler(req, res, next) {
  try {
    const result = await deleteProduct(req.params.code);
    return res.status(200).json({
      status_code: 200,
      status_description: result.message,
    });
  } catch (error) {
    next(error);
  }
}
