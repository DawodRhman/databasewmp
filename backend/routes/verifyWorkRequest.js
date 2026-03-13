// ─── Verify Work Request Routes ─────────────────────────────────────────────
const router = require('express').Router();
const { apiError } = require('../lib/apiResponse');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, async (req, res) => {
    return apiError(res, { message: 'Not yet migrated — copy from app/api/verify-work-request/route.js', statusCode: 501 });
});

module.exports = router;
