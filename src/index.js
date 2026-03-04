import { app } from './app.js';
import 'dotenv/config';
import { ensureClickSyncRepeatJob } from './queues/clickSync.queue.js';
import './workers/clickSync.worker.js';

const PORT = process.env.PORT || 5000;

await ensureClickSyncRepeatJob();

app.listen(PORT, () => {
	console.log(`  PostgreSQL Running `);
	console.log(`  Express.js running on PORT: ${PORT}`);
});
