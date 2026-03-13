// ─── Videos Routes ─────────────────────────────────────────────────────────
const router = require('express').Router();
const { apiResponse, apiError } = require('../lib/apiResponse');
const { requireAuth } = require('../middleware/auth');

// TODO: Migrate from app/api/videos/*/route.js
router.get('/', requireAuth, async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });
router.get('/getinfo', requireAuth, async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });
router.post('/upload', requireAuth, async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });
router.get('/work-request', requireAuth, async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });
router.get('/workrequest', requireAuth, async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });

module.exports = router;
