// ─── User Actions Routes ───────────────────────────────────────────────────
const router = require('express').Router();
const { query } = require('../lib/db');
const { apiResponse, apiError } = require('../lib/apiResponse');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, async (req, res) => {
    try {
        const { page = '1', limit = '20', user_id } = req.query;
        const pageNum = parseInt(page, 10); const limitNum = parseInt(limit, 10);

        let q = 'SELECT * FROM user_actions';
        let cq = 'SELECT COUNT(*) FROM user_actions';
        const params = []; let idx = 1;

        if (user_id) { q += ` WHERE user_id = $${idx}`; cq += ` WHERE user_id = $${idx}`; params.push(user_id); idx++; }
        q += ' ORDER BY created_at DESC';
        const cp = [...params];
        q += ` LIMIT $${idx} OFFSET $${idx + 1}`; params.push(limitNum, (pageNum - 1) * limitNum);

        const [countR, dataR] = await Promise.all([query(cq, cp), query(q, params)]);
        return apiResponse(res, dataR.rows, { page: pageNum, limit: limitNum, total: parseInt(countR.rows[0].count, 10) });
    } catch (error) { return apiError(res, error); }
});

module.exports = router;
