import { redis } from '../db/redis.js';
import { db } from '../db/index.js';
import { urlTable } from '../models/index.js';
import { sql, eq } from 'drizzle-orm';

export const saveClicksToDbFromRedis = async () => {
	try {
		const keys = await redis.keys('url:*');
		const pipeline = redis.pipeline();

		const updates = [];

		for (const key of keys) {
			const data = await redis.hgetall(key);
			if (!data || !data.click_count) continue;

			const clicks = Number(data.click_count);
			if (clicks > 0) {
				const shortId = key.split(':')[1];
				updates.push({ shortId, clicks });
				pipeline.hset(key, 'click_count', 0);
			}
		}

		await pipeline.exec();

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
		console.log('  Redis click counts persisted to DB');
	} catch (error) {
		console.error('Click Persistance to DB Failed by Redis: ' + error);
	}
};
