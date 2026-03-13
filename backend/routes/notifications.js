// ─── Notifications Routes ──────────────────────────────────────────────────
const router = require('express').Router();
const { query } = require('../lib/db');
const { apiResponse, apiError } = require('../lib/apiResponse');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
    try {
        const { user_id, limit = '20' } = req.query;
        const uid = user_id || req.user.id;
        const result = await query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
            [uid, parseInt(limit, 10)]
        );
        return apiResponse(res, result.rows);
    } catch (error) { return apiError(res, error); }
});

router.put('/read', requireAuth, async (req, res) => {
    try {
        const { id } = req.body;
        const result = await query('UPDATE notifications SET is_read=true WHERE id=$1 RETURNING *', [id]);
        return apiResponse(res, result.rows[0]);
    } catch (error) { return apiError(res, error); }
});

module.exports = router;
