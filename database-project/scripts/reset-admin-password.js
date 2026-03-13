/**
 * Reset Admin Password Script
 * Usage: node scripts/reset-admin-password.js [new-password]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'warehouse',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
});

async function resetAdminPassword() {
    const newPassword = process.argv[2] || 'Admin@123';
    const adminEmail = process.argv[3] || 'admin@kwsc.gos.pk';

    console.log(`Resetting password for: ${adminEmail}`);

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const result = await pool.query(
            'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, name, email, role_id',
            [hashedPassword, adminEmail]
        );

        if (result.rowCount === 0) {
            console.log('❌ User not found. Creating admin user...');

            await pool.query(
                `INSERT INTO users (name, email, password, role_id, status)
         VALUES ($1, $2, $3, $4, $5)`,
                ['System Admin', adminEmail, hashedPassword, 1, 'active']
            );
            console.log('✅ Admin user created');
        } else {
            console.log('✅ Password updated for:', result.rows[0].name);
        }

        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${newPassword}`);
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

resetAdminPassword();
