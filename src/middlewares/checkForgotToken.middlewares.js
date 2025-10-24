import { eq, gt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { ApiError } from '../utils/ApiError.js';
import crypto from 'crypto';
import { usersTable } from '../models/index.js';

export const checkForgotToken = async (req, _, next) => {
	try {
		const { token: tokenFromFrontend } = req.query;

		const hashedTokenFromFrontend = crypto
			.createHash('sha256')
			.update(tokenFromFrontend)
			.digest('hex');

		const currentTime = new Date();

		const equalExpiryTokenHash = await db
			.select({
				time: usersTable.forgot_password_token_expiry,
			})
			.from(usersTable)
			.where(
				eq(usersTable.forgot_password_token, hashedTokenFromFrontend),
				gt(usersTable.forgot_password_token_expiry, currentTime),
			);

		if (equalExpiryTokenHash.length === 0)
			throw new ApiError(400, 'Incorrect Expiry Token Passed');
		else if (currentTime > equalExpiryTokenHash[0].time) {
			await db
				.update(usersTable)
				.set({
					forgot_password_token: null,
					forgot_password_token_expiry: null,
				})
				.where(
					eq(
						usersTable.forgot_password_token,
						hashedTokenFromFrontend,
					),
				);
			throw new ApiError(400, 'Password Reset Link has expired');
		}
		req.hashed_reset_token = hashedTokenFromFrontend;
		req.token = tokenFromFrontend;
		next();
	} catch (error) {
		next(error);
	}
};
