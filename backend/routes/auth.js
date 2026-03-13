// ─── Auth Routes ───────────────────────────────────────────────────────────
// POST /api/auth/login        → Email/password login, returns JWT
// POST /api/auth/refresh      → Refresh access token
// POST /api/auth/logout       → Invalidate token (client-side)
// GET  /api/auth/me           → Get current user from token
// POST /api/auth/efiling-login → E-Filing specific login
// ────────────────────────────────────────────────────────────────────────────

const router = require('express').Router();
const { authenticateUser, generateTokens, verifyToken } = require('../lib/auth');
const { requireAuth } = require('../middleware/auth');
const { connectToDatabase } = require('../lib/db');
const { apiResponse, apiError, ValidationError, UnauthorizedError } = require('../lib/apiResponse');
const bcrypt = require('bcryptjs');

// ─── Login ─────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return apiError(res, new ValidationError('Email and password are required'));
        }

        const user = await authenticateUser(email, password);
        if (!user) {
            return apiError(res, new UnauthorizedError('Invalid email or password'), 401);
        }

        const tokens = generateTokens(user);

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/api/auth',
        });

        return apiResponse(res, {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
                userType: user.userType,
            },
            accessToken: tokens.accessToken,
        });
    } catch (error) {
        console.error('Login error:', error);
        return apiError(res, error);
    }
});

// ─── E-Filing Login ────────────────────────────────────────────────────────
router.post('/efiling-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return apiError(res, new ValidationError('Email and password are required'));
        }

        let client;
        try {
            client = await connectToDatabase();

            // Check efiling_users table (joined with users for credentials)
            const result = await client.query(
                `SELECT eu.id as efiling_user_id, eu.user_id, eu.department_id,
                        eu.efiling_role_id, eu.designation, eu.employee_id,
                        u.name, u.email, u.password, u.image, u.role as user_role,
                        r.name as role_name, r.code as role_code,
                        d.name as department_name
                 FROM efiling_users eu
                 JOIN users u ON eu.user_id = u.id
                 LEFT JOIN efiling_roles r ON eu.efiling_role_id = r.id
                 LEFT JOIN efiling_departments d ON eu.department_id = d.id
                 WHERE u.email = $1 AND eu.is_active = true`,
                [email]
            );

            if (result.rows.length === 0) {
                return apiError(res, new UnauthorizedError('Invalid credentials'), 401);
            }

            const eUser = result.rows[0];
            const isValid = await bcrypt.compare(password, eUser.password.trim());
            if (!isValid) {
                return apiError(res, new UnauthorizedError('Invalid credentials'), 401);
            }

            const userPayload = {
                id: eUser.user_id,
                efilingUserId: eUser.efiling_user_id,
                name: eUser.name,
                email: eUser.email,
                role: eUser.user_role,
                efiling_role_id: eUser.efiling_role_id,
                role_code: eUser.role_code,
                department_id: eUser.department_id,
                department_name: eUser.department_name,
                image: eUser.image,
                userType: 'efiling',
            };

            const tokens = generateTokens(userPayload);

            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/api/auth',
            });

            return apiResponse(res, {
                user: userPayload,
                accessToken: tokens.accessToken,
            });
        } finally {
            if (client) client.release();
        }
    } catch (error) {
        console.error('E-Filing login error:', error);
        return apiError(res, error);
    }
});

// ─── Refresh Token ─────────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if (!refreshToken) {
            return apiError(res, new UnauthorizedError('No refresh token'), 401);
        }

        const decoded = verifyToken(refreshToken);
        if (decoded.type !== 'refresh') {
            return apiError(res, new UnauthorizedError('Invalid refresh token'), 401);
        }

        // Fetch fresh user data
        let client;
        try {
            client = await connectToDatabase();
            const result = await client.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
            if (result.rows.length === 0) {
                return apiError(res, new UnauthorizedError('User not found'), 401);
            }

            const user = result.rows[0];
            const tokens = generateTokens({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
                userType: 'user',
            });

            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/api/auth',
            });

            return apiResponse(res, { accessToken: tokens.accessToken });
        } finally {
            if (client) client.release();
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        return apiError(res, new UnauthorizedError('Invalid refresh token'), 401);
    }
});

// ─── Logout ────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken', { path: '/api/auth' });
    return apiResponse(res, { message: 'Logged out successfully' });
});

// ─── Get Current User ──────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
    try {
        const client = await connectToDatabase();
        try {
            const result = await client.query(
                'SELECT id, name, email, role, image, contact_number, created_date FROM users WHERE id = $1',
                [req.user.id]
            );
            if (result.rows.length === 0) {
                return apiError(res, new UnauthorizedError('User not found'), 401);
            }
            return apiResponse(res, result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        return apiError(res, error);
    }
});

module.exports = router;
