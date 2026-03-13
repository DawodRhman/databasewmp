// ─── Database Seed Script ───────────────────────────────────────────────────
// Inserts initial lookup data (statuses, default admin user, etc.)
// Run after migrations: node seed.js
// ────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    user: process.env.DB_USER || 'root',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'warehouse',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // ─── Status Lookup ───────────────────────────────────────────────────
        console.log('Seeding statuses...');
        const statuses = ['Pending', 'In Progress', 'Completed', 'Rejected', 'Cancelled'];
        for (const name of statuses) {
            await client.query(
                `INSERT INTO status (name) VALUES ($1) ON CONFLICT DO NOTHING`,
                [name]
            );
        }

        // ─── Default Admin User ──────────────────────────────────────────────
        console.log('Seeding default admin user...');
        const adminPassword = await bcrypt.hash('admin123', 10);
        await client.query(
            `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
            ['Admin', 'admin@kwsc.gos.pk', adminPassword, 1]
        );

        // ─── E-Filing File Statuses ──────────────────────────────────────────
        console.log('Seeding e-filing file statuses...');
        const fileStatuses = [
            { name: 'Draft', code: 'DRAFT', color: '#6B7280' },
            { name: 'Open', code: 'OPEN', color: '#3B82F6' },
            { name: 'In Progress', code: 'IN_PROGRESS', color: '#F59E0B' },
            { name: 'Pending Review', code: 'PENDING_REVIEW', color: '#8B5CF6' },
            { name: 'Approved', code: 'APPROVED', color: '#10B981' },
            { name: 'Closed', code: 'CLOSED', color: '#EF4444' },
        ];
        for (const s of fileStatuses) {
            await client.query(
                `INSERT INTO efiling_file_status (name, code, color) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                [s.name, s.code, s.color]
            );
        }

        // ─── E-Filing Roles ──────────────────────────────────────────────────
        console.log('Seeding e-filing roles...');
        const roles = [
            { name: 'Administrator', code: 'ADMIN' },
            { name: 'CEO', code: 'CEO' },
            { name: 'COO', code: 'COO' },
            { name: 'Director', code: 'DIRECTOR' },
            { name: 'Manager', code: 'MANAGER' },
            { name: 'Officer', code: 'OFFICER' },
            { name: 'Clerk', code: 'CLERK' },
        ];
        for (const r of roles) {
            await client.query(
                `INSERT INTO efiling_roles (name, code) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [r.name, r.code]
            );
        }

        await client.query('COMMIT');
        console.log('✅ Database seeded successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Seed failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
