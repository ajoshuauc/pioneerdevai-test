import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/apiRoutes.js';
import { env } from './config/env.js';

export const app = express();

app.set('trust proxy', 1);

const allowedOrigins = env.FRONTEND_ORIGINS
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());
app.use('/api/execute', limiter);
  
// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api', apiRoutes);

// Error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});