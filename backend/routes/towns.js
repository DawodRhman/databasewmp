// ─── Towns Routes ──────────────────────────────────────────────────────────
const router = require('express').Router();
const { query } = require('../lib/db');
const { apiResponse, apiError, NotFoundError } = require('../lib/apiResponse');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
    try {
        const { id, district_id } = req.query;
        if (id) {
            const result = await query('SELECT * FROM towns WHERE id = $1', [id]);
            if (result.rows.length === 0) throw new NotFoundError('Town not found');
            return apiResponse(res, result.rows[0]);
        }
        let q = 'SELECT * FROM towns';
        const params = [];
        if (district_id) { q += ' WHERE district_id = $1'; params.push(district_id); }
        q += ' ORDER BY name';
        const result = await query(q, params);
        return apiResponse(res, result.rows);
    } catch (error) { return apiError(res, error); }
});

router.post('/', requireAdmin, async (req, res) => {
    try {
        const { name, district_id } = req.body;
        const result = await query('INSERT INTO towns (name, district_id) VALUES ($1, $2) RETURNING *', [name, district_id]);
        return apiResponse(res, result.rows[0], null, 201);
    } catch (error) { return apiError(res, error); }
});

router.put('/', requireAdmin, async (req, res) => {
    try {
        const { id, name, district_id } = req.body;
        const result = await query('UPDATE towns SET name=$1, district_id=$2 WHERE id=$3 RETURNING *', [name, district_id, id]);
        if (result.rows.length === 0) throw new NotFoundError('Town not found');
        return apiResponse(res, result.rows[0]);
    } catch (error) { return apiError(res, error); }
});

router.delete('/', requireAdmin, async (req, res) => {
    try {
        const { id } = req.body;
        const result = await query('DELETE FROM towns WHERE id=$1 RETURNING *', [id]);
        if (result.rows.length === 0) throw new NotFoundError('Town not found');
        return apiResponse(res, result.rows[0]);
    } catch (error) { return apiError(res, error); }
});

// GET /api/towns/subtowns
router.get('/subtowns', requireAuth, async (req, res) => {
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

module.exports = router;
