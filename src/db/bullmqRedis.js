import Redis from 'ioredis';

export const bullmqRedis = new Redis({
	host: process.env.REDIS_HOST || '127.0.0.1',
	port: Number(process.env.REDIS_PORT || 6379),
	// Required by BullMQ for blocking operations.
	maxRetriesPerRequest: null,
});

