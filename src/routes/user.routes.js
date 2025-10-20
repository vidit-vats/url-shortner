import { Router } from 'express';
import {
	loginUser,
	logoutUser,
	new_refresh_token,
	registerUser,
} from '../controllers/user.controllers.js';
import { validationMiddleware } from '../middlewares/validation.middlewares.js';
import { loginSchemaValidation } from '../middlewares/userlogin.middlewares.js';
import { validateJWT } from '../middlewares/auth.middlewares.js';

const router = Router();

router.route('/register').post(validationMiddleware, registerUser);
router.route('/login').post(loginSchemaValidation, loginUser);

router.use(validateJWT);

router.route('/logout').post(logoutUser);
router.route('/refresh-token').post(new_refresh_token);

export default router;
