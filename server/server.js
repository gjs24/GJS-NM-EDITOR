import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { cashfreeRouter } from './routes/cashfree.js';
import { templatesRouter } from './routes/templates.js';
import { usersRouter } from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

// Middlewares
app.use(morgan('dev'));
app.use(
  cors({
    origin: FRONTEND_URL === '*' ? true : FRONTEND_URL,
    credentials: true
  })
);
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check (Used by Render to verify deployment status)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'GJS Railway Board Studio Backend',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="background:#0b192c;color:#fff;font-family:sans-serif;text-align:center;padding:50px;">
        <h1 style="color:#00b4d8;">🚆 GJS Railway Board Studio · Render Backend API</h1>
        <p>Status: <strong style="color:#22c55e;">Online & Operational</strong></p>
        <p>Database: Supabase PostgreSQL · Payment: Cashfree Gateway</p>
        <p style="color:#94a3b8;font-size:12px;">Connected to Vercel Frontend</p>
      </body>
    </html>
  `);
});

// Mount Routes
app.use('/api/cashfree', cashfreeRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/users', usersRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong on the backend.'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 GJS Railway Studio Backend running on port ${PORT}`);
  console.log(`📡 Health check available at: http://localhost:${PORT}/health`);
});

