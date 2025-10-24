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

const router = Router();

router.route('/register').post(validationMiddleware, registerUser);
router.route('/login').post(loginSchemaValidation, loginUser);
router.route('/forgot-password').post(grantForgotToken);
router.route('/reset-password').post(checkForgotToken, resetPassword);

router.use(validateJWT);

router.route('/logout').post(logoutUser);
router.route('/refresh-token').post(new_refresh_token);

export default router;
