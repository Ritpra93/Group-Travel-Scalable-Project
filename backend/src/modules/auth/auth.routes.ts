import { Router } from 'express';
import { authController } from './auth.controller';
import { asyncHandler } from '../../middleware/asyncHandler.middleware';

/**
 * Authentication routes
 * Prefix: /api/v1/auth
 */
const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', asyncHandler(authController.register.bind(authController)));

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and get tokens
 * @access  Public
 */
router.post('/login', asyncHandler(authController.login.bind(authController)));

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Public (requires refresh token in body)
 */
router.post('/logout', asyncHandler(authController.logout.bind(authController)));

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (requires refresh token in body)
 */
router.post('/refresh', asyncHandler(authController.refresh.bind(authController)));

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private (requires authentication)
 * @note    Will be protected by auth middleware in app.ts
 */
router.get('/me', asyncHandler(authController.me.bind(authController)));

export default router;
