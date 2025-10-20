import { ApiError } from '../utils/ApiError.js';
import { loginSchema } from '../utils/userlogin.utils.js';

export const loginSchemaValidation = (req, _, next) => {
	try {
		const { value, error } = loginSchema.validate(req.body, {
			abortEarly: false,
		});

		if (error) {
			const errors = error.details.map((dt) => dt.message);
			return next(new ApiError(400, errors));
		}

		req.body = value;
		next();
	} catch (error) {
		next(error);
	}
};
