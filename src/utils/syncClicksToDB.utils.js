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

			// -------- Pipeline #1: READ --------
			const readPipe = redis.pipeline();
			for (const key of keys) readPipe.hgetall(key);

			const rawResults = await readPipe.exec();

			// Collect updates
			const updates = [];

			for (let i = 0; i < rawResults.length; i++) {
				const [err, data] = rawResults[i];
				if (err || !data) continue;

				const clicks = Number(data.click_count || 0);
				if (clicks === 0) continue;

				const shortId = keys[i].split(':')[1];
				updates.push({ shortId, clicks });
			}

			// -------- Pipeline #2: RESET --------
			if (updates.length > 0) {
				const resetPipe = redis.pipeline();
				for (const { shortId } of updates) {
					const key = `url:${shortId}`;
					resetPipe.hset(key, 'click_count', 0);
				}
				await resetPipe.exec();
			}

			// -------- Update DB --------
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

				console.log(`✔ Synced ${updates.length} click counters to DB`);
			}
		} while (cursor !== 0);
	} catch (error) {
		console.error('❌ Sync Failed: ', error);
	}
};
