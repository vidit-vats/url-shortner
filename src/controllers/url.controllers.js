import { urlTable } from '../models/index.js';
import { customAlphabet } from 'nanoid';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { db } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { redis } from '../db/redis.js';

const shortUrl = asyncHandler(async (req, res) => {
	const { long_url } = req.body;

	if (!long_url) throw new ApiError(400, 'Valid Long URL not supplied');

	const shortid = customAlphabet(
		'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
		8,
	)();

	const saveShortUrl = await db
		.insert(urlTable)
		.values({
			long_url: long_url,
			short_url: shortid,
			user_id: req.user.id,
		})
		.returning({
			long_url: urlTable.long_url,
			short_url: urlTable.short_url,
			user_id: urlTable.user_id,
		});

	if (!saveShortUrl) throw new ApiError(500, 'Record Saving Failed');

	await redis.set(shortid, long_url, 'EX', 3600).catch((err) => {
		console.warn('Redis Caching Failed: ' + err);
	});

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				'Short URL Generated Successfully',
				saveShortUrl[0],
			),
		);
});

const redirectShortUrl = asyncHandler(async (req, res) => {
	const { shorturl } = req.params;

	const result_in_cache = await redis.get(shorturl);

	if (result_in_cache) {
		console.log('Result Found in Cache :-)');
		return res.redirect(result_in_cache);
	}

	const result = await db
		.update(urlTable)
		.set({ click_count: sql`${urlTable.click_count} + 1` })
		.where(eq(urlTable.short_url, shorturl))
		.returning({
			long_url: urlTable.long_url,
		});

	if (result.length === 0) throw new ApiError(404, 'No Such URL exists');

	await redis.set(shorturl, result[0].long_url, 'EX', 3600).catch((err) => {
		console.warn('Storage in Redis Failed: ' + err);
	});

	return res.redirect(result[0].long_url);
});

export { shortUrl, redirectShortUrl };
