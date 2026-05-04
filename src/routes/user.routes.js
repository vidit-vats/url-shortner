import { Router } from 'express';
import {
	grantForgotToken,
	loginUser,
	logoutUser,
	new_refresh_token,
	registerUser,
	resetPassword,
} from '../controllers/user.controllers.js';
import { validationMiddleware } from '../middlewares/validation.middlewares.js';
import { loginSchemaValidation } from '../middlewares/userlogin.middlewares.js';
import { validateJWT } from '../middlewares/auth.middlewares.js';
import { checkForgotToken } from '../middlewares/checkForgotToken.middlewares.js';
import { limiter } from '../middlewares/ratelimit.middlewares.js';
import { google_login } from '../controllers/user.controllers.js';

const router = Router();

// Register Route
router.route('/auth/register').post(validationMiddleware, registerUser);
// Login Route
router.route('/auth/login').post(loginSchemaValidation, loginUser);
// Google Login OIDC Route
router.route('/auth/google').post(google_login);
// Forgot Password Route
router.route('/auth/forgot-password').post(limiter, grantForgotToken);
// Reset Password Route
router.route('/auth/reset-password').post(checkForgotToken, resetPassword);
// Refresh Token Route
router.route('/auth/refresh').post(new_refresh_token);
// Validate JWT Middleware
router.use(validateJWT);
// Logout Route
router.route('/auth/logout').post(logoutUser);

export default router;
