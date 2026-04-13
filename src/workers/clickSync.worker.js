import bullmq from 'bullmq';
import { redis } from '../db/redis.js';
import { bullmqRedis } from '../db/bullmqRedis.js';
import { db } from '../db/index.js';
import { urlTable } from '../models/index.js';
import { eq, sql } from 'drizzle-orm';

const { Worker } = bullmq;

const DIRTY_SET_KEY = 'clicks:dirty';
const CLICKS_KEY_PREFIX = 'clicks:';

async function drainDirtyIds(batchSize) {
	// ioredis supports SPOP with a count argument.
	const ids = await redis.spop(DIRTY_SET_KEY, batchSize);
	if (!ids) return [];
	return Array.isArray(ids) ? ids : [ids];
}

async function incrementDb(shortId, delta) {
	if (delta <= 0) return;
	await db
		.update(urlTable)
		.set({ click_count: sql`${urlTable.click_count} + ${delta}` })
		.where(eq(urlTable.short_url, shortId));
}

export const clickSyncWorker = new Worker(
	'click-sync',
	async () => {
		const batchSize = 200;
		const maxBatchesPerRun = 25; // hard cap so a single job doesn't run forever

		for (let b = 0; b < maxBatchesPerRun; b++) {
			const shortIds = await drainDirtyIds(batchSize);
			if (shortIds.length === 0) break;

			await Promise.all(
				shortIds.map(async (shortId) => {
					const key = `${CLICKS_KEY_PREFIX}${shortId}`;

					// Read the current pending clicks *without* clearing them yet.
					const pendingRaw = await redis.get(key);
					const delta = Number(pendingRaw || 0);
					if (delta <= 0) return;

					try {
						// If this throws, BullMQ will retry the job.
						await incrementDb(shortId, delta);
						// On success, subtract the applied delta so any new clicks stay in Redis.
						// await redis.decrby(key, delta);

						const newVal = await redis.decrby(key, delta);

						if (newVal === 0) {
							await redis.del(key);
						}
					} catch (err) {
						// Do NOT modify Redis on failure; the full delta stays for the retry.
						throw err;
					}
				}),
			);
		}
	},
	{
		connection: bullmqRedis,
		concurrency: 1,
		lockDuration: 60_000,
	},
);
