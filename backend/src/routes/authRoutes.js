import { Router } from 'express';
import { register, login, getCurrentUser, logout } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../validators/authValidator.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Public Authentication Endpoints
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);

// Protected Identity Endpoint
router.get('/me', authenticate, getCurrentUser);

export default router;
