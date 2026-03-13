// ─── Complaint Types Routes ────────────────────────────────────────────────
const router = require('express').Router();
const { connectToDatabase, query } = require('../lib/db');
const { apiResponse, apiError, NotFoundError } = require('../lib/apiResponse');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
    try {
        const { id } = req.query;
        if (id) {
            const result = await query('SELECT * FROM complaint_types WHERE id = $1', [id]);
            if (result.rows.length === 0) throw new NotFoundError('Complaint type not found');
            return apiResponse(res, result.rows[0]);
        }
        const result = await query('SELECT * FROM complaint_types ORDER BY name');
        return apiResponse(res, result.rows);
    } catch (error) { return apiError(res, error); }
});

router.post('/', requireAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        const result = await query('INSERT INTO complaint_types (name) VALUES ($1) RETURNING *', [name]);
        return apiResponse(res, result.rows[0], null, 201);
    } catch (error) { return apiError(res, error); }
});

router.put('/', requireAdmin, async (req, res) => {
    try {
        const { id, name } = req.body;
        const result = await query('UPDATE complaint_types SET name=$1 WHERE id=$2 RETURNING *', [name, id]);
        if (result.rows.length === 0) throw new NotFoundError('Complaint type not found');
        return apiResponse(res, result.rows[0]);
    } catch (error) { return apiError(res, error); }
});

router.delete('/', requireAdmin, async (req, res) => {
    try {
        const { id } = req.body;
        const result = await query('DELETE FROM complaint_types WHERE id=$1 RETURNING *', [id]);
        if (result.rows.length === 0) throw new NotFoundError('Complaint type not found');
        return apiResponse(res, result.rows[0]);
    } catch (error) { return apiError(res, error); }
});

router.get('/:id', requireAuth, async (req, res) => {
    try {
        const result = await query('SELECT * FROM complaint_types WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) throw new NotFoundError('Complaint type not found');
        return apiResponse(res, result.rows[0]);
    } catch (error) { return apiError(res, error); }
});

module.exports = router;
