import { urlTable } from '../models/index.js';
import { customAlphabet } from 'nanoid';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { db } from '../db/index.js';
import { eq, sql } from 'drizzle-orm';
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
			long_url,
			short_url: shortid,
			user_id: req.user.id,
		})
		.returning({
			long_url: urlTable.long_url,
			short_url: urlTable.short_url,
			user_id: urlTable.user_id,
			click_count: urlTable.click_count,
		});

	if (!saveShortUrl) throw new ApiError(500, 'Record Saving Failed');

	try {
		await redis.hset(`url:${shortid}`, {
			long_url,
			click_count: saveShortUrl[0].click_count,
		});
		await redis.expire(`url:${shortid}`, 3600); // 1 hour
	} catch (err) {
		console.warn('Redis Caching Failed: ' + err);
	}

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
	const redis_key = `url:${shorturl}`;

	const result_in_cache = await redis.hgetall(redis_key);

	if (Object.keys(result_in_cache).length !== 0) {
		console.log('Result Found in Cache :-)');
		await redis.hincrby(redis_key, 'click_count', 1);

		setInterval(async () => {}, 5 * 60 * 1000);

		return res.redirect(result_in_cache.long_url);
	}

	const result = await db
		.update(urlTable)
		.set({ click_count: sql`${urlTable.click_count} + 1` })
		.where(eq(urlTable.short_url, shorturl))
		.returning({
			long_url: urlTable.long_url,
			click_count: urlTable.click_count,
		});

	if (result.length === 0) throw new ApiError(404, 'No Such URL exists');

	try {
		await redis.hset(redis_key, {
			long_url: result[0].long_url,
			click_count: result[0].click_count,
		});
		await redis.expire(redis_key, 3600);
	} catch (err) {
		console.warn('Redis Caching Failed: ' + err);
	}

	return res.redirect(result[0].long_url);
});

const getClickCount = asyncHandler(async (req, res) => {
	const { shorturl } = req.query;

	console.log(shorturl);
});

export { shortUrl, redirectShortUrl, getClickCount };
