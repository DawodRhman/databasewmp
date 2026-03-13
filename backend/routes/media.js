// ─── Media Routes ──────────────────────────────────────────────────────────
const router = require('express').Router();
const { apiError } = require('../lib/apiResponse');
const { requireAuth } = require('../middleware/auth');

// TODO: Migrate from app/api/media/upload/route.js
router.post('/upload', requireAuth, async (req, res) => {
    return apiError(res, { message: 'Not yet migrated', statusCode: 501 });
});

module.exports = router;
