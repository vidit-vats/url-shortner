import express from 'express';
import userRoutes from './routes/user.routes.js';
import urlRoutes from './routes/url.routes.js';
import cookieParser from 'cookie-parser';
import passport from './utils/passport.utils.js';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/url', urlRoutes);

export { app };
