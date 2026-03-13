// ─── COO Routes ────────────────────────────────────────────────────────────
const router = require('express').Router();
const { apiError } = require('../lib/apiResponse');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/analytics', async (req, res) => { return apiError(res, { message: 'Not yet migrated — copy from app/api/coo/analytics/route.js', statusCode: 501 }); });
router.post('/approve-request', async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });
router.get('/profile', async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });
router.get('/requests', async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });
router.put('/requests', async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });
router.post('/refresh-session', async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });

module.exports = router;
