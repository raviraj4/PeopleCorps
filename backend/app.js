import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import roleRoutes from './routes/role.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import profileRoutes from './routes/profile.routes.js';
import reportRoutes from './routes/report.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

const app = express();
let databaseReady;
const configuredOrigins = process.env.CLIENT_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(cors({ origin: configuredOrigins?.length ? configuredOrigins : true }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use(async (_req, _res, next) => {
  try {
    if (mongoose.connection.readyState === 0) databaseReady = undefined;
    databaseReady ??= connectDatabase();
    await databaseReady;
    next();
  } catch (error) {
    databaseReady = undefined;
    next(error);
  }
});

app.get('/api/health/ready', (_req, res) => res.json({ success: true, data: { status: 'ready', database: 'connected' } }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
