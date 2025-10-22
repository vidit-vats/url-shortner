import { app } from './app.js';
import 'dotenv/config';
import { saveClicksToDbFromRedis } from './utils/flushClicks.utils.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log(` PSQL running successfully`);
	console.log(`Express running on ${PORT}`);

	setInterval(
		async () => {
			try {
				await saveClicksToDbFromRedis();
				console.log('  Redis click counts persisted to DB');
			} catch (error) {
				console.error(
					'❌ Click Persistance Failed to reach DB by Redis',
				);
			}
		},
		5 * 60 * 1000,
	);
});
