import { Router } from 'express';
import { longUrlValidation } from '../middlewares/longurl-validation.middlewares.js';
import { validateJWT } from '../middlewares/auth.middlewares.js';
import {
	deleteParticularURL,
	getClickCount,
	particularURLDetail,
	shortUrl,
} from '../controllers/url.controllers.js';

const router = Router();

router.use(validateJWT);

router.route('/').post(longUrlValidation, shortUrl);

router.route('/:shorturl').get(particularURLDetail);

router.route('/:shorturl').delete(deleteParticularURL);

router.route('/:shorturl/clicks').get(getClickCount);

export default router;
