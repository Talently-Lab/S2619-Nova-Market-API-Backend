import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { createUser } from '../services/create.user.service.js';
import { userLogin } from '../services/user.login.service.js';
import { protectedProfile } from '../services/protected.profile.service.js';

const router = Router();
const {
  registerUser,
  loginUser,
  protectedProfile: getProtectedProfile,
} = authController({ createUser, userLogin, protectedProfile });

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', getProtectedProfile);

export default router;