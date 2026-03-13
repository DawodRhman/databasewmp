// ─── Mobile API Routes ─────────────────────────────────────────────────────
// Converted from app/api/mobile/*/route.js
// ────────────────────────────────────────────────────────────────────────────
const router = require('express').Router();
const { apiError } = require('../lib/apiResponse');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Mobile auth routes (may use different token strategy)
router.post('/auth/login', async (req, res) => {
    // TODO: Migrate from app/api/mobile/auth/route.js
    return apiError(res, { message: 'Not yet migrated', statusCode: 501 });
});

router.post('/auth/register', async (req, res) => {
    return apiError(res, { message: 'Not yet migrated', statusCode: 501 });
});

// Mobile data routes
const mobileRoutes = [
    'before-content', 'complaints', 'contractors', 'divisions',
    'images', 'requests', 'towns', 'users', 'videos'
];

mobileRoutes.forEach(route => {
    router.get(`/${route}`, requireAuth, async (req, res) => {
        return apiError(res, { message: `Not yet migrated — copy from app/api/mobile/${route}/route.js`, statusCode: 501 });
    });
    router.post(`/${route}`, requireAuth, async (req, res) => {
        return apiError(res, { message: `Not yet migrated — copy from app/api/mobile/${route}/route.js`, statusCode: 501 });
    });
});

module.exports = router;
