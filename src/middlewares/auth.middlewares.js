import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';

export const validateJWT = (req, _, next) => {
	try {
		const auth = req.header('Authorization');
		const bearer = auth?.startsWith('Bearer ')
			? auth.slice('Bearer '.length).trim()
			: null;
		const token = req.cookies?.access_token || bearer;

		if (!token)
			throw new ApiError(
				401,
				'JWT Authentication Failure. No access token (cookie or Bearer)',
			);

		const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

		req.user = { id: decodedToken.id };
		next();
	} catch (error) {
		next(error);
	}
};
