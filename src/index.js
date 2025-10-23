import { app } from './app.js';
import 'dotenv/config';
import { saveClicksToDbFromRedis } from './utils/flushClicks.utils.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log(`  PSQL Running `);
	console.log(`  Express running on PORT: ${PORT}`);

	setInterval(
		async () => {
			try {
				await saveClicksToDbFromRedis();
			} catch (error) {
				console.error(
					'❌ Click Persistance Failed to reach DB by Redis',
				);
			}
		},
		5 * 60 * 1000,
	);
});
