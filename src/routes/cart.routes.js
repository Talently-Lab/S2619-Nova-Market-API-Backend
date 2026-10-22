import { Router } from 'express';
import { notImplemented } from './not-implemented.js';

const router = Router();

router.post('/create', notImplemented);
router.patch('/:id', notImplemented);

export default router;