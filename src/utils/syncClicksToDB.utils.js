import { redis } from '../db/redis.js';
import { db } from '../db/index.js';
import { urlTable } from '../models/index.js';
import { sql, eq } from 'drizzle-orm';

export const saveClicksToDbFromRedis = async () => {
	try {
		let cursor = 0;

		do {
			const [newCursor, keys] = await redis.scan(
				cursor,
				'MATCH',
				'url:*',
				'COUNT',
				100,
			);
			cursor = Number(newCursor);

			if (keys.length === 0) continue;

			const pipeline = redis.pipeline();
			const updates = [];

			// Fetch data for all keys in this batch
			for (const key of keys) {
				pipeline.hgetall(key);
			}

			const results = await pipeline.exec();

			for (let i = 0; i < results.length; i++) {
				const [err, data] = results[i];
				if (err || !data || !data.long_url) continue;

				const clicks = Number(data.click_count || 0);
				if (clicks === 0) continue;

				const shortId = keys[i].split(':')[1];
				updates.push({ shortId, clicks });

				// Reset Redis click_count atomically
				pipeline.hset(keys[i], 'click_count', 0);
			}

			// Apply reset in Redis
			if (updates.length > 0) await pipeline.exec();

			// Update DB in parallel
			if (updates.length > 0) {
				await Promise.all(
					updates.map(({ shortId, clicks }) =>
						db
							.update(urlTable)
							.set({
								click_count: sql`${urlTable.click_count} + ${clicks}`,
							})
							.where(eq(urlTable.short_url, shortId)),
					),
				);
				console.log(
					`✅ Persisted ${updates.length} URLs click counts to DB`,
				);
			}
		} while (cursor !== 0);
	} catch (error) {
		console.error('❌ Click Persistence Failed: ', error);
	}
};
