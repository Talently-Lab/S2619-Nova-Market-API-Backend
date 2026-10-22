import { Router } from 'express';
import { notImplemented } from './not-implemented.js';

const router = Router();

router.post('/register/users', notImplemented);
router.post('/login', notImplemented);

export default router;