// ─── Images Routes ─────────────────────────────────────────────────────────
const router = require('express').Router();
const { connectToDatabase } = require('../lib/db');
const { apiResponse, apiError } = require('../lib/apiResponse');
const { requireAuth } = require('../middleware/auth');

// TODO: Migrate from app/api/images/work-request/route.js
router.get('/work-request', requireAuth, async (req, res) => {
    return apiError(res, { message: 'Not yet migrated — copy logic from app/api/images/work-request/route.js', statusCode: 501 });
});

router.post('/work-request', requireAuth, async (req, res) => {
    return apiError(res, { message: 'Not yet migrated', statusCode: 501 });
});

module.exports = router;
