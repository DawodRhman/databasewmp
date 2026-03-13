// ─── Requests Routes ───────────────────────────────────────────────────────
// Work request CRUD. Migrate from app/api/requests/route.js
// ────────────────────────────────────────────────────────────────────────────
const router = require('express').Router();
const { connectToDatabase, query } = require('../lib/db');
const { apiResponse, apiError, NotFoundError } = require('../lib/apiResponse');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
    const client = await connectToDatabase();
    try {
        const { id, page = '1', limit = '10', filter, status, district_id, town_id } = req.query;
        if (id) {
            const result = await client.query('SELECT * FROM work_request WHERE id = $1', [id]);
            if (result.rows.length === 0) throw new NotFoundError('Request not found');
            return apiResponse(res, result.rows[0]);
        }

        const pageNum = parseInt(page, 10); const limitNum = parseInt(limit, 10);
        let dataQuery = 'SELECT * FROM work_request';
        let countQuery = 'SELECT COUNT(*) FROM work_request';
        const wheres = []; const params = []; let idx = 1;

        if (filter) { wheres.push(`(description ILIKE $${idx} OR CAST(id AS TEXT) ILIKE $${idx})`); params.push(`%${filter}%`); idx++; }
        if (status) { wheres.push(`status = $${idx}`); params.push(status); idx++; }
        if (district_id) { wheres.push(`district_id = $${idx}`); params.push(district_id); idx++; }
        if (town_id) { wheres.push(`town_id = $${idx}`); params.push(town_id); idx++; }

        if (wheres.length) { const w = ' WHERE ' + wheres.join(' AND '); dataQuery += w; countQuery += w; }
        dataQuery += ' ORDER BY created_date DESC';
        const cParams = [...params];
        if (limitNum > 0) { dataQuery += ` LIMIT $${idx} OFFSET $${idx + 1}`; params.push(limitNum, (pageNum - 1) * limitNum); }

        const [countR, dataR] = await Promise.all([client.query(countQuery, cParams), client.query(dataQuery, params)]);
        return apiResponse(res, dataR.rows, { page: pageNum, limit: limitNum, total: parseInt(countR.rows[0].count, 10) });
    } catch (error) { return apiError(res, error); }
    finally { if (client) client.release(); }
});

// POST, PUT, DELETE — TODO: Migrate from app/api/requests/route.js
router.post('/', requireAuth, async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });
router.put('/', requireAuth, async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });
router.delete('/', requireAuth, async (req, res) => { return apiError(res, { message: 'Not yet migrated', statusCode: 501 }); });

// GET /api/requests/:id
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const result = await query('SELECT * FROM work_request WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) throw new NotFoundError('Request not found');
        return apiResponse(res, result.rows[0]);
    } catch (error) { return apiError(res, error); }
});

module.exports = router;
