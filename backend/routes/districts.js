// ─── Districts Routes ──────────────────────────────────────────────────────
const router = require('express').Router();
const { query } = require('../lib/db');
const { apiResponse, apiError, NotFoundError } = require('../lib/apiResponse');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
    try {
        const { id } = req.query;
        if (id) {
            const result = await query('SELECT * FROM districts WHERE id = $1', [id]);
            if (result.rows.length === 0) throw new NotFoundError('District not found');
            return apiResponse(res, result.rows[0]);
        }
        const result = await query('SELECT * FROM districts ORDER BY name');
        return apiResponse(res, result.rows);
    } catch (error) { return apiError(res, error); }
});

router.post('/', requireAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        const result = await query('INSERT INTO districts (name) VALUES ($1) RETURNING *', [name]);
        return apiResponse(res, result.rows[0], null, 201);
    } catch (error) { return apiError(res, error); }
});

router.put('/', requireAdmin, async (req, res) => {
    try {
        const { id, name } = req.body;
        const result = await query('UPDATE districts SET name=$1 WHERE id=$2 RETURNING *', [name, id]);
        if (result.rows.length === 0) throw new NotFoundError('District not found');
        return apiResponse(res, result.rows[0]);
    } catch (error) { return apiError(res, error); }
});

router.delete('/', requireAdmin, async (req, res) => {
    try {
        const { id } = req.body;
        const result = await query('DELETE FROM districts WHERE id=$1 RETURNING *', [id]);
        if (result.rows.length === 0) throw new NotFoundError('District not found');
        return apiResponse(res, result.rows[0]);
    } catch (error) { return apiError(res, error); }
});

module.exports = router;
