// ─── Dashboard Routes ──────────────────────────────────────────────────────
// Converted from app/api/dashboard/*/route.js → Express router.
// ────────────────────────────────────────────────────────────────────────────

const router = require('express').Router();
const { connectToDatabase, query } = require('../lib/db');
const { apiResponse, apiError } = require('../lib/apiResponse');
const { requireAuth } = require('../middleware/auth');

// ─── GET /api/dashboard/stats ──────────────────────────────────────────────
router.get('/stats', requireAuth, async (req, res) => {
    const client = await connectToDatabase();
    try {
        // Total complaints
        const complaintsResult = await client.query('SELECT COUNT(*) FROM complaints');
        // Total users
        const usersResult = await client.query('SELECT COUNT(*) FROM users');
        // Total agents
        const agentsResult = await client.query('SELECT COUNT(*) FROM agents');
        // Total requests
        const requestsResult = await client.query('SELECT COUNT(*) FROM work_request');

        return apiResponse(res, {
            totalComplaints: parseInt(complaintsResult.rows[0].count, 10),
            totalUsers: parseInt(usersResult.rows[0].count, 10),
            totalAgents: parseInt(agentsResult.rows[0].count, 10),
            totalRequests: parseInt(requestsResult.rows[0].count, 10),
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return apiError(res, error);
    } finally {
        if (client) client.release();
    }
});

// ─── GET /api/dashboard/charts ─────────────────────────────────────────────
router.get('/charts', requireAuth, async (req, res) => {
    const client = await connectToDatabase();
    try {
        // Monthly complaint trends
        const monthlyResult = await client.query(`
      SELECT DATE_TRUNC('month', created_date) as month, COUNT(*) as count
      FROM complaints
      WHERE created_date >= NOW() - INTERVAL '12 months'
      GROUP BY month ORDER BY month
    `);

        // Complaints by status
        const statusResult = await client.query(`
      SELECT s.name as status, COUNT(*) as count
      FROM complaints c
      LEFT JOIN status s ON c.status = s.id
      GROUP BY s.name
    `);

        return apiResponse(res, {
            monthlyTrend: monthlyResult.rows,
            byStatus: statusResult.rows,
        });
    } catch (error) {
        console.error('Error fetching chart data:', error);
        return apiError(res, error);
    } finally {
        if (client) client.release();
    }
});

// ─── GET /api/dashboard/filters ────────────────────────────────────────────
router.get('/filters', requireAuth, async (req, res) => {
    try {
        const [districts, towns, statuses] = await Promise.all([
            query('SELECT id, name FROM districts ORDER BY name'),
            query('SELECT id, name, district_id FROM towns ORDER BY name'),
            query('SELECT id, name FROM status ORDER BY id'),
        ]);

        return apiResponse(res, {
            districts: districts.rows,
            towns: towns.rows,
            statuses: statuses.rows,
        });
    } catch (error) {
        console.error('Error fetching filters:', error);
        return apiError(res, error);
    }
});

// ─── GET /api/dashboard/reports ────────────────────────────────────────────
router.get('/reports', requireAuth, async (req, res) => {
    const client = await connectToDatabase();
    try {
        const { type, from, to, district_id, town_id } = req.query;

        let reportQuery = `
      SELECT c.*, d.name as district_name, t.name as town_name, s.name as status_name
      FROM complaints c
      LEFT JOIN districts d ON c.district_id = d.id
      LEFT JOIN towns t ON c.town_id = t.id
      LEFT JOIN status s ON c.status = s.id
      WHERE 1=1
    `;
        const params = [];
        let idx = 1;

        if (from) { reportQuery += ` AND c.created_date >= $${idx}`; params.push(from); idx++; }
        if (to) { reportQuery += ` AND c.created_date <= $${idx}`; params.push(to); idx++; }
        if (district_id) { reportQuery += ` AND c.district_id = $${idx}`; params.push(district_id); idx++; }
        if (town_id) { reportQuery += ` AND c.town_id = $${idx}`; params.push(town_id); idx++; }

        reportQuery += ' ORDER BY c.created_date DESC';

        const result = await client.query(reportQuery, params);
        return apiResponse(res, result.rows);
    } catch (error) {
        console.error('Error fetching reports:', error);
        return apiError(res, error);
    } finally {
        if (client) client.release();
    }
});

// ─── GET /api/dashboard/map ────────────────────────────────────────────────
router.get('/map', requireAuth, async (req, res) => {
    const client = await connectToDatabase();
    try {
        const result = await client.query(`
      SELECT c.id, c.latitude, c.longitude, c.description, c.created_date,
             d.name as district_name, t.name as town_name, s.name as status_name
      FROM complaints c
      LEFT JOIN districts d ON c.district_id = d.id
      LEFT JOIN towns t ON c.town_id = t.id
      LEFT JOIN status s ON c.status = s.id
      WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
    `);
        return apiResponse(res, result.rows);
    } catch (error) {
        console.error('Error fetching map data:', error);
        return apiError(res, error);
    } finally {
        if (client) client.release();
    }
});

module.exports = router;
