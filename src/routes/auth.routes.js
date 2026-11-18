import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { createUser } from '../services/create.user.service.js';
import { userLogin } from '../services/user.login.service.js';

const router = Router();
const { registerUser, loginUser } = authController({ createUser, userLogin });

router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;