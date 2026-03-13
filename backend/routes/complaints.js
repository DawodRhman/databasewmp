// ─── Complaints Routes ─────────────────────────────────────────────────────
const router = require('express').Router();
const { connectToDatabase, query } = require('../lib/db');
const { apiResponse, apiError } = require('../lib/apiResponse');
const { requireAuth } = require('../middleware/auth');

// GET /api/complaints/getalltypes
router.get('/getalltypes', requireAuth, async (req, res) => {
    try {
        const result = await query('SELECT * FROM complaint_types ORDER BY name');
        return apiResponse(res, result.rows);
    } catch (error) { return apiError(res, error); }
});

// GET /api/complaints/getcomplaint
router.get('/getcomplaint', requireAuth, async (req, res) => {
    const client = await connectToDatabase();
    try {
        const { id } = req.query;
        const result = await client.query(
            `SELECT c.*, d.name as district_name, t.name as town_name, s.name as status_name
       FROM complaints c
       LEFT JOIN districts d ON c.district_id = d.id
       LEFT JOIN towns t ON c.town_id = t.id
       LEFT JOIN status s ON c.status = s.id
       WHERE c.id = $1`, [id]
        );
        return apiResponse(res, result.rows[0] || null);
    } catch (error) { return apiError(res, error); }
    finally { if (client) client.release(); }
});

// GET /api/complaints/getinfo
router.get('/getinfo', requireAuth, async (req, res) => {
    // TODO: Migrate from app/api/complaints/getinfo/route.js
    return apiError(res, { message: 'Not yet migrated', statusCode: 501 });
});

// Subtypes
router.get('/subtypes', requireAuth, async (req, res) => {
    try {
        const { type_id } = req.query;
        let q = 'SELECT * FROM complaint_sub_types';
        const params = [];
        if (type_id) { q += ' WHERE complaint_type_id = $1'; params.push(type_id); }
        q += ' ORDER BY name';
        const result = await query(q, params);
        return apiResponse(res, result.rows);
    } catch (error) { return apiError(res, error); }
});

// Types
router.get('/types', requireAuth, async (req, res) => {
    try {
        const result = await query('SELECT * FROM complaint_types ORDER BY name');
        return apiResponse(res, result.rows);
    } catch (error) { return apiError(res, error); }
});

// Performa
router.get('/performa', requireAuth, async (req, res) => {
    // TODO: Migrate from app/api/complaints/performa/route.js
    return apiError(res, { message: 'Not yet migrated', statusCode: 501 });
});

module.exports = router;
