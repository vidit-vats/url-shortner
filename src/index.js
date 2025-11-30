import { app } from './app.js';
import 'dotenv/config';
import { cronjob } from './utils/cronjob.utils.js';

const PORT = process.env.PORT || 5000;

cronjob();

app.listen(PORT, () => {
	console.log(`  PSQL Running `);
	console.log(`  Express running on PORT: ${PORT}`);
});
