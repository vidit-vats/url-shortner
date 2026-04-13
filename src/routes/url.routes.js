import { Router } from 'express';
import { longUrlValidation } from '../middlewares/longurl-validation.middlewares.js';
import { validateJWT } from '../middlewares/auth.middlewares.js';
import {
	deleteParticularURL,
	getClickCount,
	particularURLDetail,
	redirectShortUrl,
	shortUrl,
} from '../controllers/url.controllers.js';
import { allURLs } from '../controllers/user.controllers.js';

const router = Router();

router.route('/redirect/:shorturl').get(redirectShortUrl);

router.use(validateJWT);

router.route("/").get(allURLs)

router.route("/:shorturl").get(particularURLDetail)

router.route("/:shorturl").delete(deleteParticularURL)

// below is for updating url details
// router.route("/:shorturl").patch()

router.route('/short-url').post(longUrlValidation, shortUrl);
router.route('/click-count/:shorturl').get(getClickCount);

export default router;
