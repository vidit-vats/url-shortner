import rateLimit from 'express-rate-limit';

// In 10 minutes, only 3 times route can be hit

export const limiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	limit: 3,
	standardHeaders: true,
	legacyHeaders: false,
	ipv6Subnet: 56,
	message: {
		success: false,
		message: 'Too many password reset attempts. Please try again later.',
	},
});
