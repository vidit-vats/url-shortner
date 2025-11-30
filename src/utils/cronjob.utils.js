import { saveClicksToDbFromRedis } from './syncClicksToDB.utils.js';
import cron from 'node-cron';

export const cronjob = () => {
	cron.schedule('* * * * *', async () => {
		console.log('Running Redis -> DB Sync');
		await saveClicksToDbFromRedis();
	});
};
