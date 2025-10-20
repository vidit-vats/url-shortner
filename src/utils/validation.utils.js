import Joi from 'joi';

export const registerSchema = Joi.object({
	username: Joi.string()
		.trim()
		.alphanum()
		.min(3)
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

	name: Joi.string().trim().max(50).required().messages({
		'string.base': 'Name must be a string',
		'string.empty': 'Name is required',
		'string.max': 'Name cannot exceed 50 characters',
		'any.required': 'Name is required',
	}),

	email: Joi.string().trim().email().required().messages({
		'string.email': 'Please provide a valid email address',
		'string.empty': 'Email is required',
		'any.required': 'Email is required',
	}),

	address: Joi.string().trim().max(200).required().messages({
		'string.base': 'Address must be a string',
		'string.empty': 'Address is required',
		'string.max': 'Address cannot exceed 200 characters',
		'any.required': 'Address is required',
	}),
});
