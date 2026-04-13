import express from 'express';
import userRoutes from './routes/user.routes.js';
import urlRoutes from './routes/url.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import globalErrorHandler from './middlewares/globalErrorHandler.middlewares.js';

const app = express();

app.use(
	cors({
		origin: process.env.CORS_ORIGIN || true,
		credentials: true,
	}),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/url', urlRoutes);

app.use(globalErrorHandler);

export { app };
