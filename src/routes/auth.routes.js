import { Router } from 'express';
import { notImplemented } from './not-implemented.js';
import { authController } from '../controllers/auth.controller.js';
import { createUser } from '../services/create.user.service.js';

const router = Router();
const { registerUser } = authController({ createUser });

router.post('/register', registerUser);
router.post('/login', notImplemented);

export default router;