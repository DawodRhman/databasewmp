// ─── JWT Authentication ─────────────────────────────────────────────────────
// Replaces NextAuth session-based auth with stateless JWT tokens.
// Backend issues JWTs on login; frontend sends them in Authorization header.
// ────────────────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in environment variables');
}

/**
 * Generate access + refresh tokens for a user.
 */
function generateTokens(user) {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        userType: user.userType || 'user',
        image: user.image || null,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ id: user.id, type: 'refresh' }, JWT_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
}

/**
 * Verify & decode a JWT token.
 */
function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

/**
 * Authenticate with email + password (users table).
 */
async function authenticateUser(email, password) {
    let client;
    try {
        client = await connectToDatabase();

        // Check users table
        let result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const storedPassword = user.password ? user.password.trim() : null;
            if (!storedPassword) return null;

            const isValid = await bcrypt.compare(password, storedPassword);
            if (!isValid) return null;

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
                contact_number: user.contact_number,
                userType: 'user',
            };
        }

        // Check efiling_users table (user credentials are in users table)
        result = await client.query(
            `SELECT eu.id as efiling_user_id, eu.user_id, eu.efiling_role_id,
                    eu.department_id, u.name, u.email, u.password, u.image
             FROM efiling_users eu
             JOIN users u ON eu.user_id = u.id
             WHERE u.email = $1 AND eu.is_active = true`,
            [email]
        );
        if (result.rows.length > 0) {
            const eUser = result.rows[0];
            const storedPassword = eUser.password ? eUser.password.trim() : null;
            if (!storedPassword) return null;

            const isValid = await bcrypt.compare(password, storedPassword);
            if (!isValid) return null;

            return {
                id: eUser.user_id,
                efilingUserId: eUser.efiling_user_id,
                name: eUser.name,
                email: eUser.email,
                role: eUser.efiling_role_id,
                image: eUser.image,
                userType: 'efiling',
            };
        }

        return null;
    } finally {
        if (client) client.release();
    }
}

module.exports = {
    generateTokens,
    verifyToken,
    authenticateUser,
    JWT_SECRET,
};
