import { urlTable } from '../models/index.js';
import { customAlphabet } from 'nanoid';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { db } from '../db/index.js';
import { and, eq } from 'drizzle-orm';
import { redis } from '../db/redis.js';

const clicksKey = (shortId) => `clicks:${shortId}`;
const DIRTY_SET_KEY = 'clicks:dirty';

const shortUrl = asyncHandler(async (req, res) => {
	const { long_url } = req.body;
	if (!long_url) throw new ApiError(400, 'Valid Long URL not supplied');

	const nanoidGenerator = customAlphabet(
		'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
		10,
	);

	const MAX_RETRIES = 5;
	let attempt = 0;
	let savedShortURL;

	while (attempt < MAX_RETRIES) {
		const shortid = nanoidGenerator();
		try {
			savedShortURL = await db
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
				});

			// If insert succeeds, break the loop
			if (savedShortURL.length) break;
		} catch (err) {
			// Check if error is unique constraint violation
			if (err.code === '23505') {
				// Postgres unique violation error code
				attempt++;
				console.warn(
					`ShortID collision detected, retrying... (attempt ${attempt})`,
				);
				continue;
			}
			// Other DB errors
			throw err;
		}
	}

	if (!savedShortURL || !savedShortURL.length) {
		throw new ApiError(
			500,
			'Failed to generate a unique short URL after retries',
		);
	}

	// Cache in Redis
	try {
		await redis.hset(`url:${savedShortURL[0].short_url}`, {
			long_url,
		});
		await redis.expire(`url:${savedShortURL[0].short_url}`, 300); // 5 min
		await redis.set(clicksKey(savedShortURL[0].short_url), '0');
	} catch (err) {
		console.warn('Redis Caching Failed: ' + err);
	}

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				'Short URL Generated Successfully',
				savedShortURL[0],
			),
		);
});

const redirectShortUrl = asyncHandler(async (req, res) => {
	const { shorturl } = req.params;
	const redis_key = `url:${shorturl}`;

	const cachedLongUrl = await redis.hget(redis_key, 'long_url');

	if (cachedLongUrl) {
		console.log('Redirection Result Found in Redis');

		res.redirect(302, cachedLongUrl);

		// fire-and-forget
		redis.incr(clicksKey(shorturl));
		redis.sadd(DIRTY_SET_KEY, shorturl);

		return;
	}

	const result = await db
		.select({
			long_url: urlTable.long_url,
		})
		.from(urlTable)
		.where(eq(urlTable.short_url, shorturl))
		.limit(1);

	if (result.length === 0) {
		throw new ApiError(404, 'No Such URL exists');
	}

	const longUrl = result[0].long_url;

	console.log(longUrl);

	res.redirect(302, longUrl);

	(async () => {
		try {
			await Promise.all([
				redis.hset(redis_key, { long_url: longUrl }),
				redis.expire(redis_key, 300),
				redis.incr(clicksKey(shorturl)),
				redis.sadd(DIRTY_SET_KEY, shorturl),
			]);
		} catch (err) {
			console.warn('Redis Caching Failed:', err);
		}
	})();
});

const getClickCount = asyncHandler(async (req, res) => {
	const { shorturl } = req.params;
	const userid = req.user.id;

	// Read Redis
	const clicksInRedis = Number((await redis.get(clicksKey(shorturl))) || 0);

	console.log('Click from redis: ' + clicksInRedis);

	// Read DB
	const clicksFromDb = await db
		.select({ click_count: urlTable.click_count })
		.from(urlTable)
		.where(
			and(eq(urlTable.user_id, userid), eq(urlTable.short_url, shorturl)),
		)
		.limit(1);

	if (!clicksFromDb.length) throw new ApiError(404, 'No Such URL exists');

	const totalClicks = clicksFromDb[0].click_count + clicksInRedis;

	return res.status(200).json(
		new ApiResponse(200, 'Click Count Fetched Successfully', {
			click_count: totalClicks,
		}),
	);
});

const particularURLDetail = asyncHandler(async (req, res) => {
	const { shorturl } = req.params;

	const [findURLDetail] = await db
		.select({
			long_url: urlTable.long_url,
			click_count: urlTable.click_count,
			created_at: urlTable.created_at,
			user_id: urlTable.user_id,
		})
		.from(urlTable)
		.where(
			and(
				eq(urlTable.short_url, shorturl),
				eq(urlTable.user_id, req.user.id),
			),
		);

	if (!findURLDetail)
		throw new ApiError(
			404,
			'No Such short URL exists for the logged-in user',
		);

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				'URL Details fetched successfully',
				findURLDetail,
			),
		);
});

const deleteParticularURL = asyncHandler(async (req, res) => {
	const { shorturl } = req.params;

	const { rowCount } = await db
		.delete(urlTable)
		.where(
			and(
				eq(urlTable.short_url, shorturl),
				eq(urlTable.user_id, req.user.id),
			),
		);

	if (rowCount === 0)
		throw new ApiError(400, "Can't delete as no such URL exists");

	return res.status(200).json(
		new ApiResponse(200, 'Short-URL deleted successfully', {
			deleted_rows: rowCount,
		}),
	);
});

export {
	shortUrl,
	redirectShortUrl,
	getClickCount,
	particularURLDetail,
	deleteParticularURL,
};
