import { Router } from 'express';
import { notImplemented } from './not-implemented.js';

const router = Router();

router.post('/create', notImplemented);
router.get('/', notImplemented);
router.patch('/:code', notImplemented);

export default router;