// ─── Database Connection Pool ──────────────────────────────────────────────
// Shared PostgreSQL connection pool for the backend API server.
// Mirrors the original lib/db.js from the monolith but without Next.js deps.
// ────────────────────────────────────────────────────────────────────────────

const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'root',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'warehouse',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    min: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
    acquireTimeoutMillis: 10000,
    maxUses: 7500,
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
    statement_timeout: 30000,
    query_timeout: 30000,
    application_name: 'wmp-backend-api',
    tcp_keepalives_idle: 600,
    tcp_keepalives_interval: 30,
    tcp_keepalives_count: 3,
    allowExitOnIdle: false,
});

// ─── Pool Event Handlers ───────────────────────────────────────────────────
pool.on('error', (err, client) => {
    console.error('Unexpected pool error:', {
        error: err.message,
        code: err.code,
        timestamp: new Date().toISOString(),
    });
});

pool.on('connect', () => {
    console.log('New client connected to database pool');
});

pool.on('remove', () => {
    console.log('Client removed from database pool');
});

// ─── Pool Stats Logging ────────────────────────────────────────────────────
const poolStatsInterval = setInterval(() => {
    const stats = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
        timestamp: new Date().toISOString(),
    };
    if (stats.waitingCount > 5 || (stats.idleCount === 0 && stats.totalCount === pool.options.max)) {
        console.warn('⚠️ Database pool exhaustion warning:', stats);
    }
}, 30000);

// ─── Connection Helpers ────────────────────────────────────────────────────

/**
 * Acquire a dedicated client from the pool.
 * Caller MUST call client.release() when done (use finally block).
 */
const connectToDatabase = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const client = await Promise.race([
                pool.connect(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Connection timeout — pool may be exhausted')), 10000)
                ),
            ]);
            await Promise.race([
                client.query('SELECT 1'),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Connection test timeout')), 5000)
                ),
            ]);
            return client;
        } catch (error) {
            console.error(`DB connection attempt ${i + 1} failed:`, error.message);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.min(500 * (i + 1), 2000)));
        }
    }
};

/**
 * Run a single query through the pool (auto-acquires & releases client).
 * Preferred for simple read/write operations.
 */
const query = async (text, params) => {
    const client = await pool.connect();
    try {
        const start = Date.now();
        const res = await client.query(text, params);
        const duration = Date.now() - start;
        if (duration > 1000) {
            console.log('Slow query:', { text: text.substring(0, 100), duration, rows: res.rowCount });
        }
        return res;
    } catch (err) {
        console.error('Query error:', { error: err.message, query: text.substring(0, 100) });
        throw err;
    } finally {
        client.release();
    }
};

/**
 * Safe client release helper for use in finally blocks.
 */
const safeRelease = (client) => {
    if (client && typeof client.release === 'function') {
        try { client.release(); } catch (e) { /* ignore */ }
    }
};

const disconnectFromDatabase = safeRelease;

/**
 * Health check — returns true if DB is reachable.
 */
const checkDbConnection = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        return true;
    } catch {
        return false;
    }
};

/**
 * Gracefully close the pool (called at shutdown).
 */
const shutdownPool = async () => {
    clearInterval(poolStatsInterval);
    clearInterval(healthCheckInterval);
    await pool.end();
};

// ─── Periodic Health Check ─────────────────────────────────────────────────
const healthCheckInterval = setInterval(async () => {
    const ok = await checkDbConnection();
    if (!ok) console.warn('Database health check failed');
}, 5 * 60 * 1000);

// ─── Exports ───────────────────────────────────────────────────────────────
module.exports = {
    pool,
    query,
    connectToDatabase,
    disconnectFromDatabase,
    safeRelease,
    checkDbConnection,
    shutdownPool,
};
