import bullmq from 'bullmq';
import { bullmqRedis } from '../db/bullmqRedis.js';

const { Queue } = bullmq;

export const clickSyncQueue = new Queue('click-sync', { connection: bullmqRedis });

export async function ensureClickSyncRepeatJob() {
	// Idempotent: BullMQ de-dupes repeatable jobs by name + repeat options.
	await clickSyncQueue.add(
		'sync-clicks-to-db',
		{},
		{
			attempts: 5,
			backoff: {
				type: 'exponential',
				delay: 5_000,
			},
			repeat: { every: 10_000 },
			removeOnComplete: true,
			removeOnFail: 100,
		},
	);
}

