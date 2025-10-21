import { Router } from 'express';
import { longUrlValidation } from '../middlewares/longurl-validation.middlewares.js';
import { validateJWT } from '../middlewares/auth.middlewares.js';
import { redirectShortUrl, shortUrl } from '../controllers/url.controllers.js';

const router = Router();

router.use(validateJWT);

router.route('/short-url').post(longUrlValidation, shortUrl);
router.route('/redirect/:shorturl').get(redirectShortUrl);

export default router;
