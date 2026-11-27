import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import {
  getProducts,
  getProductCategories,
  getProduct,
  postProduct,
  putProduct,
  deleteProductHandler,
} from '../controllers/product.controller.js';

const router = Router();

// ── Rutas públicas ────────────────────────────────────────────────────────────
// IMPORTANTE: /categories debe ir antes de /:code para evitar que Express
// interprete "categories" como un valor del parámetro :code.
router.get('/categories', getProductCategories);
router.get('/', getProducts);
router.get('/:code', getProduct);

// ── Rutas de administración (solo Admin) ─────────────────────────────────────
router.post('/', authenticate, requireRole('Admin'), postProduct);
router.put('/:code', authenticate, requireRole('Admin'), putProduct);
router.delete('/:code', authenticate, requireRole('Admin'), deleteProductHandler);

export default router;
