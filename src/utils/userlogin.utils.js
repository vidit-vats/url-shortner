import Joi from 'joi';

export const loginSchema = Joi.object({
	username: Joi.string()
		.trim()
		.min(3)
		.alphanum()
		.max(10)
		.required()
		.messages({
			'string.base': 'Username must be a string',
			'string.empty': 'Username is required',
			'string.alphanum': 'Username can only contain letters and numbers',
			'string.min': 'Username must be at least 3 characters',
			'string.max': 'Username cannot exceed 10 characters',
			'any.required': 'Username is required',
		}),

	password: Joi.string()
		.trim()
		.pattern(
			new RegExp(
				'^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
			),
		)
		.required()
		.messages({
			'string.pattern.base':
				'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
			'string.empty': 'Password is required',
			'any.required': 'Password is required',
		}),
});
