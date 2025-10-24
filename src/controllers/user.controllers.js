import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { usersTable } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs/promises';

async function generateHashedPassword(password) {
	return bcrypt.hash(password, 10);
}

async function comparePassword(password, hashedPassword) {
	return await bcrypt.compare(password, hashedPassword);
}

async function generateAccessToken(userid) {
	const user = await db
		.select({ id: usersTable.id, username: usersTable.username })
		.from(usersTable)
		.where(eq(usersTable.id, userid));

	const access_token = jwt.sign(user[0], process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
	});

	return { access_token };
}

async function generateRefreshToken(userid) {
	const user = await db
		.select({ id: usersTable.id, username: usersTable.username })
		.from(usersTable)
		.where(eq(usersTable.id, userid));

	const refresh_token = jwt.sign(user[0], process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
	});

	await db
		.update(usersTable)
		.set({
			refresh_token: refresh_token,
		})
		.where(eq(usersTable.id, userid));

	return { refresh_token };
}

const registerUser = asyncHandler(async (req, res) => {
	const { username, password, name, address, email } = req.body;

	const userExists = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.username, username));

	if (userExists.length !== 0) throw new ApiError(400, 'User Already Exists');

	const hashedPassword = await generateHashedPassword(password);

	const newUser = await db
		.insert(usersTable)
		.values({
			username: username,
			email: email,
			password: hashedPassword,
			address: address,
			name: name,
		})
		.returning({
			username: usersTable.username,
			email: usersTable.email,
			address: usersTable.address,
			name: usersTable.name,
		});

	return res
		.status(200)
		.json(new ApiResponse(201, 'User Registered Successfully', newUser[0]));
});

const loginUser = asyncHandler(async (req, res) => {
	const { username, password } = req.body;

	const userExists = await db
		.select({ id: usersTable.id, hashedPassword: usersTable.password })
		.from(usersTable)
		.where(eq(usersTable.username, username));

	if (!userExists) throw new ApiError(400, 'No such user exists');

	const isPasswordCorrect = await comparePassword(
		password,
		userExists[0].hashedPassword,
	);

	if (!isPasswordCorrect) throw new ApiError(400, 'Wrong Password Supplied');

	const userid = userExists[0].id;

	const options = {
		httpOnly: true,
		secure: true,
	};

	const { access_token } = await generateAccessToken(userid);
	const { refresh_token } = await generateRefreshToken(userid);

	return res
		.cookie('access_token', access_token, options)
		.cookie('refresh_token', refresh_token, options)
		.status(200)
		.json(new ApiResponse(200, 'User Logged In'));
});

const logoutUser = asyncHandler(async (req, res) => {
	await db
		.update(usersTable)
		.set({
			refresh_token: null,
		})
		.where(eq(usersTable.id, req.user.id));

	return res
		.clearCookie('access_token')
		.clearCookie('refresh_token')
		.status(200)
		.json(new ApiResponse(200, 'User Logged Out'));
});

const new_refresh_token = asyncHandler(async (req, res) => {
	const { access_token } = await generateAccessToken(req.user.id);
	const { refresh_token } = await generateRefreshToken(req.user.id);

	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.cookie('access_token', access_token, options)
		.cookie('refresh_token', refresh_token, options)
		.status(200)
		.json(new ApiResponse(200, 'New Refresh Token Supplied'));
});

const grantForgotToken = asyncHandler(async (req, res) => {
	const { email } = req.body;

	const resetToken = crypto.randomBytes(32).toString('hex');

	const hashedToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');

	const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

	const savedResetToken = await db
		.update(usersTable)
		.set({
			forgot_password_token_expiry: expiresAt,
			forgot_password_token: hashedToken,
		})
		.where(eq(usersTable.email, email));

	if (!savedResetToken)
		return res
			.status(400)
			.json(new ApiResponse(400, 'No such user exists'));

	const transporter = nodemailer.createTransport({
		host: process.env.MAILTRAP_HOST,
		port: Number(process.env.MAILTRAP_PORT),
		auth: {
			user: process.env.MAILTRAP_USERNAME,
			pass: process.env.MAILTRAP_PASSWORD,
		},
	});

	const htmlFilePath = path.join(process.cwd(), 'sample.html');
	let htmlContent = await fs.readFile(htmlFilePath, 'utf-8');

	const resetUrl = `https://yourapp.com/reset-password?token=${resetToken}`;
	htmlContent = htmlContent.replace('{{RESET_URL}}', resetUrl);

	try {
		await transporter.sendMail({
			from: 'viditpndt@example.com',
			to: email,
			subject: 'Forgot Password Email from Mailtrap / Nodemailer',
			text: 'This email is for generating the password as user forgot password',
			html: htmlContent,
		});
	} catch (error) {
		console.error('Error sending email:', error);
		return res
			.status(500)
			.json(new ApiResponse(500, 'Failed to send email'));
	}

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				'Password Reset Link has been sent successfully',
			),
		);
});

const resetPassword = asyncHandler(async (req, res) => {
	const { new_password } = req.body;
	const { confirm_new_password } = req.body;

	if (new_password !== confirm_new_password)
		throw new ApiError(
			400,
			"Passwords don't match. New and Confirm must be same",
		);

	const hash_new_password = await generateHashedPassword(new_password);

	await db
		.update(usersTable)
		.set({
			password: hash_new_password,
			forgot_password_token: null,
			forgot_password_token_expiry: null,
			refresh_token: null,
		})
		.where(eq(usersTable.forgot_password_token, req.hashed_reset_token));

	return res
		.clearCookie('access_token')
		.clearCookie('refresh_token')
		.status(200)
		.json(new ApiResponse(200, 'Password Changed Successfully'));
});

export {
	registerUser,
	loginUser,
	logoutUser,
	new_refresh_token,
	grantForgotToken,
	resetPassword,
};
