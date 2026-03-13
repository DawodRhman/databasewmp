// ─── Database Migration Runner ──────────────────────────────────────────────
// Runs SQL migration files in order from the migrations/ directory.
//
// Usage:
//   node migrate.js          → Run all pending migrations
//   node migrate.js up       → Run all pending migrations
//   node migrate.js status   → Show migration status
// ────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    user: process.env.DB_USER || 'root',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'warehouse',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(client) {
    await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getExecutedMigrations(client) {
    const result = await client.query('SELECT name FROM _migrations ORDER BY id');
    return new Set(result.rows.map(r => r.name));
}

async function getAllMigrations() {
    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort();
    return files;
}

async function runMigrations() {
    const client = await pool.connect();
    try {
        await ensureMigrationsTable(client);
        const executed = await getExecutedMigrations(client);
        const allMigrations = await getAllMigrations();
        const pending = allMigrations.filter(m => !executed.has(m));

        if (pending.length === 0) {
            console.log('✅ All migrations are up to date.');
            return;
        }

        const continueOnError = process.argv.includes('--continue-on-error');
        console.log(`📋 ${pending.length} pending migration(s):`);

        let succeeded = 0;
        let failed = 0;
        for (const migration of pending) {
            console.log(`  ⏳ Running: ${migration}`);
            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, migration), 'utf8');

            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query('INSERT INTO _migrations (name) VALUES ($1)', [migration]);
                await client.query('COMMIT');
                console.log(`  ✅ Done: ${migration}`);
                succeeded++;
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`  ❌ Failed: ${migration}`, err.message);
                failed++;
                if (!continueOnError) throw err;
            }
        }

        if (failed > 0) {
            console.log(`\n⚠️  ${succeeded} succeeded, ${failed} failed out of ${pending.length} migration(s).`);
        } else {
            console.log(`\n✅ All ${pending.length} migration(s) completed successfully.`);
        }
    } finally {
        client.release();
        await pool.end();
    }
}

async function showStatus() {
    const client = await pool.connect();
    try {
        await ensureMigrationsTable(client);
        const executed = await getExecutedMigrations(client);
        const allMigrations = await getAllMigrations();

        console.log('\n📋 Migration Status:\n');
        for (const m of allMigrations) {
            const status = executed.has(m) ? '✅' : '⏳';
            console.log(`  ${status} ${m}`);
        }
        console.log(`\n  Total: ${allMigrations.length} | Executed: ${executed.size} | Pending: ${allMigrations.length - executed.size}`);
    } finally {
        client.release();
        await pool.end();
    }
}

// ─── CLI ───────────────────────────────────────────────────────────────────
const command = process.argv[2] || 'up';

if (command === 'status') {
    showStatus().catch(console.error);
} else {
    runMigrations().catch(err => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
}
