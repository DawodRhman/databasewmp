// ─── WMP Backend API Server ─────────────────────────────────────────────────
// Express.js API server separated from the Next.js monolith.
// Deployed independently on its own VM.
// ────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { validateNetwork } = require('./middleware/validateNetwork');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Trust Proxy (when behind nginx/LB) ────────────────────────────────────
if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
}

// ─── CORS Configuration ────────────────────────────────────────────────────
// Allow frontend VM(s) to communicate with this backend
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Total-Pages'],
}));

// ─── Security Headers ──────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many login attempts' } },
});

// ─── Network Validation ────────────────────────────────────────────────────
// Only allow requests from trusted frontend/internal IPs in production.
// Configure ALLOWED_NETWORKS in .env (e.g., 10.0.1.0/24,192.168.1.10)
app.use('/api', validateNetwork);

// ─── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Request Logging ───────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Static Files (uploads) ───────────────────────────────────────────────
// UPLOAD_DIR can point to a shared/mounted volume from the Database VM
// e.g., /mnt/db-storage/uploads (NFS mount) or a local path
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOAD_DIR));

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
    const { checkDbConnection } = require('./lib/db');
    const dbHealthy = await checkDbConnection();
    res.json({
        success: true,
        data: {
            status: dbHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            database: dbHealthy ? 'connected' : 'disconnected',
            uptime: process.uptime(),
        },
    });
});

// ─── API Routes ────────────────────────────────────────────────────────────
// Auth routes (rate-limited)
app.use('/api/auth', authLimiter, require('./routes/auth'));

// User & Admin routes
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/agents', require('./routes/agents'));

// Dashboard routes
app.use('/api/dashboard', require('./routes/dashboard'));

// Complaint routes
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/complaint-types', require('./routes/complaintTypes'));

// Geography routes
app.use('/api/districts', require('./routes/districts'));
app.use('/api/towns', require('./routes/towns'));
app.use('/api/subtowns', require('./routes/subtowns'));

// Work Request routes
app.use('/api/requests', require('./routes/requests'));

// Media routes
app.use('/api/images', require('./routes/images'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/final-videos', require('./routes/finalVideos'));
app.use('/api/media', require('./routes/media'));
app.use('/api/files', require('./routes/files'));

// Status routes
app.use('/api/status', require('./routes/status'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/user-actions', require('./routes/userActions'));

// CE / CEO / COO portal routes
app.use('/api/ce', require('./routes/ce'));
app.use('/api/ceo', require('./routes/ceo'));
app.use('/api/coo', require('./routes/coo'));

// Social media routes
app.use('/api/socialmediaperson', require('./routes/socialMediaPerson'));

// E-Filing routes (large sub-system)
app.use('/api/efiling', require('./routes/efiling'));

// Mobile API routes
app.use('/api/mobile', require('./routes/mobile'));

// File upload/serve routes
app.use('/api/uploads', require('./routes/uploads'));

// Before-content routes
app.use('/api/before-content', require('./routes/beforeContent'));
app.use('/api/before-images', require('./routes/beforeImages'));

// Verify work request
app.use('/api/verify-work-request', require('./routes/verifyWorkRequest'));

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
    });
});

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);

    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message =
        statusCode === 500 && process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message;

    res.status(statusCode).json({
        success: false,
        error: { code, message, ...(err.details ? { details: err.details } : {}) },
    });
});

// ─── Start Server ──────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ WMP Backend API running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
});

// ─── Graceful Shutdown ─────────────────────────────────────────────────────
const shutdown = () => {
    console.log('Shutting down gracefully...');
    const { shutdownPool } = require('./lib/db');
    shutdownPool().then(() => {
        console.log('Database pool closed');
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
