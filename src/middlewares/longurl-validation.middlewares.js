import { ApiError } from '../utils/ApiError.js';
import { urlSchema } from '../utils/validUrl.utils.js';

export const longUrlValidation = (req, _, next) => {
	try {
		const { error, value } = urlSchema.validate(req.body, {
			abortEarly: false,
		});

		if (error)
			next(new ApiError(400, 'Long URL is not as per expected format'));

		req.body = value;
		next();
	} catch (error) {
		next(error);
	}
};
