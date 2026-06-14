/**
 * Smart Queue Management System — Backend Server
 * Express + Socket.io + PostgreSQL
 */
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { runMigrations } = require('./db/migrate');

const authRoutes = require('./routes/auth.routes');
const orgRoutes = require('./routes/org.routes');
const orgQueueRoutes = require('./routes/orgQueue.routes');
const orgTokenRoutes = require('./routes/orgToken.routes');
const orgAnalyticsRoutes = require('./routes/orgAnalytics.routes');
const locationRoutes = require('./routes/location.routes');
const queueRoutes = require('./routes/queue.routes');
const tokenRoutes = require('./routes/token.routes');
const publicTokenRoutes = require('./routes/publicToken.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const contactRoutes = require('./routes/contact.routes');
const { initializeSocket } = require('./socket/index');

const app = express();
const server = http.createServer(app);

const isProd = process.env.NODE_ENV === 'production';

// Frontend origin for CORS (Vercel domain). Backward-compatible alias: CORS_ORIGIN.
const clientUrl = process.env.CLIENT_URL || process.env.CORS_ORIGIN || null;

if (isProd && !clientUrl) {
  throw new Error('CLIENT_URL is required in production for CORS (set to your Vercel app URL).');
}

const io = new Server(server, {
  cors: {
    origin: isProd ? clientUrl : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set('io', io);
initializeSocket(io);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: isProd ? clientUrl : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
}));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SmartQueue API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/org/queues', orgQueueRoutes);
app.use('/api/org/analytics', orgAnalyticsRoutes);
app.use('/api/org', orgTokenRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/public', apiLimiter, publicTokenRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 2 MB or smaller.'
        : err.message;
    return res.status(400).json({ success: false, message });
  }
  if (err.message && err.message.includes('Only JPEG')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  console.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
let readyPromise = null;

async function startServer() {
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    await runMigrations();

    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(PORT, () => {
        server.removeListener('error', reject);
        if (!isProd) {
          console.log(`
SmartQueue API Server
Port:        ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
Socket.io:   Enabled
API Base:    http://localhost:${PORT}/api
Health:      http://localhost:${PORT}/api/health
Client URL:  ${clientUrl || '(any origin allowed)'}
          `);
        } else {
          console.log(`SmartQueue API Server listening on port ${PORT}`);
        }
        resolve();
      });
    });

    return server;
  })();

  return readyPromise;
}

const ready = startServer();

ready.catch((error) => {
  console.error('Failed to start SmartQueue API server:', error.message);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = { app, server, io, startServer, ready };
