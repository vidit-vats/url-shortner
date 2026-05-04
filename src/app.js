import express from 'express';
import userRoutes from './routes/user.routes.js';
import urlRoutes from './routes/url.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import globalErrorHandler from './middlewares/globalErrorHandler.middlewares.js';
import { redirectShortUrl } from './controllers/url.controllers.js';

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

// Public Routes
app.get('/r/:shorturl', redirectShortUrl);

// Private Routes
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/url', urlRoutes);

app.use(globalErrorHandler);

export { app };
