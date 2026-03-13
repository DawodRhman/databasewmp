// ─── Final Videos Routes ───────────────────────────────────────────────────
const router = require('express').Router();
const { apiError } = require('../lib/apiResponse');
const { requireAuth } = require('../middleware/auth');

// TODO: Migrate from app/api/final-videos/*/route.js
router.get('/', requireAuth, async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });
router.post('/', requireAuth, async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });
router.post('/chunk', requireAuth, async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });
router.post('/finalize', requireAuth, async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });

module.exports = router;
