import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { usersTable } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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

export { registerUser, loginUser, logoutUser, new_refresh_token };
