// ─── Admin Routes ──────────────────────────────────────────────────────────
// Converted from app/api/admin/*/route.js → Express router.
// ────────────────────────────────────────────────────────────────────────────

const router = require('express').Router();
const { connectToDatabase, query } = require('../lib/db');
const { apiResponse, apiError } = require('../lib/apiResponse');
const { requireAdmin } = require('../middleware/auth');

// All admin routes require admin role
router.use(requireAdmin);

// GET /api/admin/ce-users
router.get('/ce-users', async (req, res) => {
    try {
        const result = await query(
            'SELECT id, name, email, role, image FROM users WHERE role IN (1,2,3) ORDER BY name'
        );
        return apiResponse(res, result.rows);
    } catch (error) {
        return apiError(res, error);
    }
});

// GET /api/admin/ceo-users
router.get('/ceo-users', async (req, res) => {
    try {
        const result = await query(
            'SELECT id, name, email, role FROM users WHERE role = 1 ORDER BY name'
        );
        return apiResponse(res, result.rows);
    } catch (error) {
        return apiError(res, error);
    }
});

// TODO: Migrate remaining admin routes from app/api/admin/*/route.js
// Each sub-route in app/api/admin/ should be added here as router.get/post/put/delete

module.exports = router;
