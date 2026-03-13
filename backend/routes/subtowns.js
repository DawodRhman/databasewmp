// ─── Subtowns Routes ───────────────────────────────────────────────────────
const router = require('express').Router();
const { query } = require('../lib/db');
const { apiResponse, apiError, NotFoundError } = require('../lib/apiResponse');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
    try {
        const { town_id } = req.query;
        let q = 'SELECT * FROM sub_towns';
        const params = [];
        if (town_id) { q += ' WHERE town_id = $1'; params.push(town_id); }
        q += ' ORDER BY name';
        const result = await query(q, params);
        return apiResponse(res, result.rows);
    } catch (error) { return apiError(res, error); }
});

router.post('/', requireAdmin, async (req, res) => {
    try {
        const { name, town_id } = req.body;
        const result = await query('INSERT INTO sub_towns (name, town_id) VALUES ($1, $2) RETURNING *', [name, town_id]);
        return apiResponse(res, result.rows[0], null, 201);
    } catch (error) { return apiError(res, error); }
});

router.put('/', requireAdmin, async (req, res) => {
    try {
        const { id, name, town_id } = req.body;
        const result = await query('UPDATE sub_towns SET name=$1, town_id=$2 WHERE id=$3 RETURNING *', [name, town_id, id]);
        if (result.rows.length === 0) throw new NotFoundError('Subtown not found');
        return apiResponse(res, result.rows[0]);
    } catch (error) { return apiError(res, error); }
});

router.delete('/', requireAdmin, async (req, res) => {
    try {
        const { id } = req.body;
        const result = await query('DELETE FROM sub_towns WHERE id=$1 RETURNING *', [id]);
        if (result.rows.length === 0) throw new NotFoundError('Subtown not found');
        return apiResponse(res, result.rows[0]);
    } catch (error) { return apiError(res, error); }
});

module.exports = router;
