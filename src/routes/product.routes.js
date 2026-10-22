
import { Router } from 'express';
import { notImplemented } from './not-implemented.js';
import {
    getProducts,
    getProduct
} from '../controllers/product.controller.js';

const router = Router();

// Consultas
router.get('/categories', notImplemented);
router.get('/', getProducts);
router.get('/:code', getProduct);

// Creación, actualización y eliminación
router.post('/', notImplemented);
router.patch('/:code', notImplemented);
router.delete('/:code', notImplemented);

export default router;
