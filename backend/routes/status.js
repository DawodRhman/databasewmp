// ─── Status Routes ─────────────────────────────────────────────────────────
const router = require('express').Router();
const { query } = require('../lib/db');
const { apiResponse, apiError } = require('../lib/apiResponse');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
    try {
        const result = await query('SELECT * FROM status ORDER BY id');
        return apiResponse(res, result.rows);
    } catch (error) { return apiError(res, error); }
});

module.exports = router;
