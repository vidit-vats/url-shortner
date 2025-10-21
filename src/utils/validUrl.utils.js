import Joi from 'joi';

export const urlSchema = Joi.object({
	long_url: Joi.string()
		.uri({ scheme: ['http', 'https'] })
		.trim()
		.required()
		.messages({
			'string.uri':
				'Please provide a valid URL starting with http or https',
			'any.required': 'URL is required',
		}),
});
