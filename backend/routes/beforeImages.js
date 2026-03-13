// ─── Before Images Routes ───────────────────────────────────────────────────
const router = require('express').Router();
const { apiError } = require('../lib/apiResponse');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
    return apiError(res, { message: 'Not yet migrated — copy from app/api/before-images/route.js', statusCode: 501 });
});
router.post('/', requireAuth, async (req, res) => {
    return apiError(res, { message: 'Not yet migrated', statusCode: 501 });
});
router.get('/:id', requireAuth, async (req, res) => {
    return apiError(res, { message: 'Not yet migrated', statusCode: 501 });
});

module.exports = router;
