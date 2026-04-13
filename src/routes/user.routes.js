import { Router } from 'express';
import {
	currentUserDetails,
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

router.route('/register').post(validationMiddleware, registerUser);
router.route('/login').post(loginSchemaValidation, loginUser);

router.route('/google-login').post(google_login);

router.route('/forgot-password').post(limiter, grantForgotToken);
router.route('/reset-password').post(checkForgotToken, resetPassword);

// Refresh Token Route
router.route('/refresh-token').post(new_refresh_token);

router.use(validateJWT);

router.route('/').get(currentUserDetails);

// router.route("/me/urls").get(allURLs)
router.route('/logout').post(logoutUser);

export default router;
