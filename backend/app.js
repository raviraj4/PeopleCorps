import express from 'express';
import cors from 'cors';
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

app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') ?? true }));
app.use(express.json());
app.use(async (_req, _res, next) => {
  try {
    databaseReady ??= connectDatabase();
    await databaseReady;
    next();
  } catch (error) {
    databaseReady = undefined;
    next(error);
  }
});

app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
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
