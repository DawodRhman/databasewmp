// ─── Social Media Person Routes ────────────────────────────────────────────
const router = require('express').Router();
const { query } = require('../lib/db');
const { apiResponse, apiError, NotFoundError } = require('../lib/apiResponse');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
    try {
        const { id } = req.query;
        if (id) {
            const result = await query('SELECT * FROM social_media_agents WHERE id = $1', [id]);
            if (result.rows.length === 0) throw new NotFoundError('Social media agent not found');
            return apiResponse(res, result.rows[0]);
        }
        const result = await query('SELECT * FROM social_media_agents ORDER BY created_date DESC');
        return apiResponse(res, result.rows);
    } catch (error) { return apiError(res, error); }
});

// POST, PUT, DELETE — TODO: Migrate from app/api/socialmediaperson/[id]/route.js
router.post('/', requireAdmin, async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });
router.put('/', requireAdmin, async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });
router.delete('/', requireAdmin, async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });

router.get('/:id', requireAuth, async (req, res) => {
    try {
        const result = await query('SELECT * FROM social_media_agents WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) throw new NotFoundError('Not found');
        return apiResponse(res, result.rows[0]);
    } catch (error) { return apiError(res, error); }
});

module.exports = router;
