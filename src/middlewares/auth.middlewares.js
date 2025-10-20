import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';

export const validateJWT = (req, _, next) => {
	try {
		const token =
			req?.cookies?.access_token ||
			req?.header('Authorization')?.split(' ')[1];

		if (!token)
			throw new ApiError(
				401,
				'JWT Authentication Failure. No Access Token',
			);

		const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

		req.user = decodedToken;
		next();
	} catch (error) {
		next(error);
	}
};
