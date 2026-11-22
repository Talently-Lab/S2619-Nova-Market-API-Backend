import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import {
  postOrder,
  getMyOrdersHandler,
  getOrdersHandler,
  patchOrderStatus,
} from '../controllers/order.controller.js';

const router = Router();

// POST /api/orders — crear orden (cualquier usuario autenticado)
router.post('/', authenticate, postOrder);

// GET /api/orders/my — mis órdenes (cualquier usuario autenticado)
// IMPORTANTE: /my debe ir antes de /:id para que Express no confunda "my" con un ID.
router.get('/my', authenticate, getMyOrdersHandler);

// GET /api/orders — todas las órdenes (solo Admin)
router.get('/', authenticate, requireRole('Admin'), getOrdersHandler);

// PATCH /api/orders/:id/status — cambiar estado (solo Admin)
router.patch('/:id/status', authenticate, requireRole('Admin'), patchOrderStatus);

export default router;
