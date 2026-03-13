// ─── Agents Routes ─────────────────────────────────────────────────────────
const router = require('express').Router();
const { connectToDatabase, query } = require('../lib/db');
const { apiResponse, apiError, NotFoundError } = require('../lib/apiResponse');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/agents
router.get('/', requireAuth, async (req, res) => {
    const client = await connectToDatabase();
    try {
        const { id, page = '1', limit = '0', filter } = req.query;

        if (id) {
            const result = await client.query('SELECT * FROM agents WHERE id = $1', [id]);
            if (result.rows.length === 0) throw new NotFoundError('Agent not found');
            return apiResponse(res, result.rows[0]);
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        let dataQuery = 'SELECT * FROM agents';
        let countQuery = 'SELECT COUNT(*) FROM agents';
        const params = [];
        let paramIdx = 1;

        if (filter) {
            const where = ` WHERE name ILIKE $${paramIdx} OR email ILIKE $${paramIdx} OR contact_number ILIKE $${paramIdx}`;
            dataQuery += where;
            countQuery += where;
            params.push(`%${filter}%`);
            paramIdx++;
        }

        dataQuery += ' ORDER BY created_date DESC';
        const countParams = [...params];

        if (limitNum > 0) {
            dataQuery += ` LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
            params.push(limitNum, (pageNum - 1) * limitNum);
        }

        const [countResult, dataResult] = await Promise.all([
            client.query(countQuery, countParams),
            client.query(dataQuery, params),
        ]);

        return apiResponse(res, dataResult.rows, {
            page: pageNum,
            limit: limitNum,
            total: parseInt(countResult.rows[0].count, 10),
        });
    } catch (error) {
        return apiError(res, error);
    } finally {
        if (client) client.release();
    }
});

// POST /api/agents
router.post('/', requireAdmin, async (req, res) => {
    // TODO: Migrate POST logic from app/api/agents/route.js
    return apiError(res, { message: 'Not yet migrated', statusCode: 501 });
});

// PUT /api/agents
router.put('/', requireAdmin, async (req, res) => {
    // TODO: Migrate PUT logic from app/api/agents/route.js
    return apiError(res, { message: 'Not yet migrated', statusCode: 501 });
});

// DELETE /api/agents
router.delete('/', requireAdmin, async (req, res) => {
    // TODO: Migrate DELETE logic from app/api/agents/route.js
    return apiError(res, { message: 'Not yet migrated', statusCode: 501 });
});

// GET /api/agents/:id
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const result = await query('SELECT * FROM agents WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) throw new NotFoundError('Agent not found');
        return apiResponse(res, result.rows[0]);
    } catch (error) {
        return apiError(res, error);
    }
});

module.exports = router;
