import { ProductModel } from '../models/product.model.js';
import { createHttpError } from '../utils/http-error.js';

// ─── Helpers de validación ────────────────────────────────────────────────────

const REQUIRED_CREATE_FIELDS = ['code', 'name', 'price'];

function validateProductBody(body, { isUpdate = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createHttpError(400, 'El cuerpo de la solicitud debe ser un objeto JSON válido.');
  }

  if (!isUpdate) {
    for (const field of REQUIRED_CREATE_FIELDS) {
      if (body[field] === undefined || body[field] === null || String(body[field]).trim() === '') {
        throw createHttpError(400, `El campo "${field}" es obligatorio.`);
      }
    }
  }

  if (body.code !== undefined) {
    if (typeof body.code !== 'string' || !body.code.trim()) {
      throw createHttpError(400, 'El campo "code" debe ser un string no vacío.');
    }
  }

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      throw createHttpError(400, 'El campo "name" debe ser un string no vacío.');
    }
  }

  if (body.price !== undefined) {
    const price = Number(body.price);
    if (Number.isNaN(price) || price < 0) {
      throw createHttpError(400, 'El campo "price" debe ser un número >= 0.');
    }
  }

  if (body.stock !== undefined) {
    const stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      throw createHttpError(400, 'El campo "stock" debe ser un entero >= 0.');
    }
  }

  if (body.category_id !== undefined) {
    const catId = Number(body.category_id);
    if (!Number.isInteger(catId) || catId <= 0) {
      throw createHttpError(400, 'El campo "category_id" debe ser un entero positivo.');
    }
  }
}

function sanitizeProductData(body, { isUpdate = false } = {}) {
  const allowed = ['code', 'name', 'description', 'price', 'image_url', 'stock', 'category_id', 'category_name', 'is_active'];
  const data = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      data[key] = body[key];
    }
  }

  if (data.price !== undefined) data.price = Number(data.price);
  if (data.stock !== undefined) data.stock = Number(data.stock);
  if (data.category_id !== undefined) data.category_id = Number(data.category_id);
  if (data.code !== undefined) data.code = String(data.code).trim();
  if (data.name !== undefined) data.name = String(data.name).trim();
  if (data.category_name !== undefined) data.category_name = String(data.category_name).trim() || null;

  return data;
}

function buildProductResponse(product) {
  return {
    id: product.id,
    code: product.code,
    name: product.name,
    description: product.description ?? null,
    price: Number(product.price),
    image_url: product.image_url ?? null,
    stock: product.stock,
    category_name: product.category_name ?? null,
    is_active: product.is_active,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

// ─── Servicios ────────────────────────────────────────────────────────────────

export async function listProducts(query) {
  const {
    category,
    search,
    min_price,
    max_price,
    order_by,
    order_dir,
    page,
    limit,
  } = query ?? {};

  const minPrice = min_price !== undefined ? Number(min_price) : undefined;
  const maxPrice = max_price !== undefined ? Number(max_price) : undefined;

  if (minPrice !== undefined && (Number.isNaN(minPrice) || minPrice < 0)) {
    throw createHttpError(400, 'El parámetro "min_price" debe ser un número >= 0.');
  }
  if (maxPrice !== undefined && (Number.isNaN(maxPrice) || maxPrice < 0)) {
    throw createHttpError(400, 'El parámetro "max_price" debe ser un número >= 0.');
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw createHttpError(400, '"min_price" no puede ser mayor que "max_price".');
  }

  const pageNum = page !== undefined ? Number(page) : 1;
  const limitNum = limit !== undefined ? Number(limit) : 20;

  if (!Number.isInteger(pageNum) || pageNum < 1) {
    throw createHttpError(400, 'El parámetro "page" debe ser un entero >= 1.');
  }
  if (!Number.isInteger(limitNum) || limitNum < 1) {
    throw createHttpError(400, 'El parámetro "limit" debe ser un entero >= 1.');
  }

  const result = await ProductModel.findAll({
    category,
    search,
    minPrice,
    maxPrice,
    orderBy: order_by,
    orderDir: order_dir,
    page: pageNum,
    limit: limitNum,
  });

  return {
    data: result.data.map(buildProductResponse),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: Math.ceil(result.total / result.limit),
  };
}

export async function getCategories() {
  const categories = await ProductModel.findCategories();
  return { categories };
}

export async function getProductByCode(code) {
  if (!code || typeof code !== 'string') {
    throw createHttpError(400, 'El código del producto es inválido.');
  }

  const product = await ProductModel.findByCode(code);
  if (!product) {
    throw createHttpError(404, `No se encontró el producto con código "${code}".`);
  }

  return buildProductResponse(product);
}

export async function createProduct(body) {
  validateProductBody(body);
  const data = sanitizeProductData(body);

  const existing = await ProductModel.findByCodeIncludingDeleted(data.code);
  if (existing) {
    throw createHttpError(409, `Ya existe un producto con el código "${data.code}".`);
  }

  const product = await ProductModel.create(data);
  return buildProductResponse(product);
}

export async function updateProduct(code, body) {
  validateProductBody(body, { isUpdate: true });
  const data = sanitizeProductData(body, { isUpdate: true });

  // Si el body cambia el code, verificar que el nuevo code no esté en uso.
  if (data.code && data.code !== code) {
    const conflict = await ProductModel.findByCodeIncludingDeleted(data.code);
    if (conflict) {
      throw createHttpError(409, `Ya existe un producto con el código "${data.code}".`);
    }
  }

  const updated = await ProductModel.updateByCode(code, data);
  if (!updated) {
    throw createHttpError(404, `No se encontró el producto con código "${code}".`);
  }

  return buildProductResponse(updated);
}

export async function deleteProduct(code) {
  const deleted = await ProductModel.softDeleteByCode(code);
  if (!deleted) {
    throw createHttpError(404, `No se encontró el producto con código "${code}".`);
  }

  return { message: `Producto "${code}" eliminado correctamente.` };
}
