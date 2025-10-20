import { registerSchema } from '../utils/validation.utils.js';
import { ApiError } from '../utils/ApiError.js';

export const validationMiddleware = (req, _, next) => {
	try {
		const { error, value } = registerSchema.validate(req.body, {
			abortEarly: false,
		});

		if (error) {
			const errors = error.details.map((e) => e.message);
			return next(new ApiError(400, errors));
		}

		req.body = value;
		next();
	} catch (error) {
		next(new ApiError(500, 'Internal Server Error'));
	}
};
