import { Router } from 'express';
import {
	googleLogin,
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
import passport from '../utils/passport.utils.js';

const router = Router();

router.route('/register').post(validationMiddleware, registerUser);
router.route('/login').post(loginSchemaValidation, loginUser);
router.route('/forgot-password').post(grantForgotToken);
router.route('/reset-password').post(checkForgotToken, resetPassword);

router.route('/google').get(
	passport.authenticate('google', {
		scope: ['profile', 'email'],
		session: false,
	}),
);

router.route('/google/callback').get(
	passport.authenticate('google', {
		session: false,
		failWithError: true,
		failureRedirect: '/login',
	}),
	googleLogin,
);
// Google Login Ends

router.use(validateJWT);

router.route('/logout').post(logoutUser);
router.route('/refresh-token').post(new_refresh_token);

export default router;
