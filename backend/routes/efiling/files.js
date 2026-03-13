// ─── E-Filing: Files ───────────────────────────────────────────────────────
// This is the largest e-filing route (~971 lines in the original).
// Full migration from app/api/efiling/files/route.js
// ────────────────────────────────────────────────────────────────────────────
const router = require('express').Router();
const { connectToDatabase } = require('../../lib/db');
const { apiResponse, apiError, NotFoundError, UnauthorizedError, ValidationError } = require('../../lib/apiResponse');

// GET /api/efiling/files
router.get('/', async (req, res) => {
    const client = await connectToDatabase();
    try {
        const {
            id, department_id, status_id, created_by, assigned_to, priority,
            file_id, district_id, town_id, division_id, zone_id,
            category_id, file_type_id, subject_search, file_number_search,
            date_from, date_to, page = '1', limit = '10'
        } = req.query;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        // Single file by ID
        if (id) {
            const result = await client.query(`
        SELECT f.*, ft.name as file_type_name, fs.name as status_name,
               d.name as department_name, fc.name as category_name
        FROM efiling_files f
        LEFT JOIN efiling_file_types ft ON f.file_type_id = ft.id
        LEFT JOIN efiling_file_status fs ON f.status_id = fs.id
        LEFT JOIN efiling_departments d ON f.department_id = d.id
        LEFT JOIN efiling_categories fc ON f.category_id = fc.id
        WHERE f.id = $1
      `, [id]);
            if (result.rows.length === 0) throw new NotFoundError('File not found');
            return apiResponse(res, result.rows[0]);
        }

        // Build filtered query
        let dataQuery = `
      SELECT f.*, ft.name as file_type_name, fs.name as status_name,
             d.name as department_name
      FROM efiling_files f
      LEFT JOIN efiling_file_types ft ON f.file_type_id = ft.id
      LEFT JOIN efiling_file_status fs ON f.status_id = fs.id
      LEFT JOIN efiling_departments d ON f.department_id = d.id
    `;
        let countQuery = 'SELECT COUNT(*) FROM efiling_files f';
        const wheres = [];
        const params = [];
        let idx = 1;

        if (department_id) { wheres.push(`f.department_id = $${idx}`); params.push(department_id); idx++; }
        if (status_id) { wheres.push(`f.status_id = $${idx}`); params.push(status_id); idx++; }
        if (created_by) { wheres.push(`f.created_by = $${idx}`); params.push(created_by); idx++; }
        if (assigned_to) { wheres.push(`f.assigned_to = $${idx}`); params.push(assigned_to); idx++; }
        if (priority) { wheres.push(`f.priority = $${idx}`); params.push(priority); idx++; }
        if (district_id) { wheres.push(`f.district_id = $${idx}`); params.push(district_id); idx++; }
        if (town_id) { wheres.push(`f.town_id = $${idx}`); params.push(town_id); idx++; }
        if (division_id) { wheres.push(`f.division_id = $${idx}`); params.push(division_id); idx++; }
        if (zone_id) { wheres.push(`f.zone_id = $${idx}`); params.push(zone_id); idx++; }
        if (category_id) { wheres.push(`f.category_id = $${idx}`); params.push(category_id); idx++; }
        if (file_type_id) { wheres.push(`f.file_type_id = $${idx}`); params.push(file_type_id); idx++; }
        if (subject_search) { wheres.push(`f.subject ILIKE $${idx}`); params.push(`%${subject_search}%`); idx++; }
        if (file_number_search) { wheres.push(`f.file_number ILIKE $${idx}`); params.push(`%${file_number_search}%`); idx++; }
        if (date_from) { wheres.push(`f.created_at >= $${idx}`); params.push(date_from); idx++; }
        if (date_to) { wheres.push(`f.created_at <= $${idx}`); params.push(date_to); idx++; }

        if (wheres.length) {
            const where = ' WHERE ' + wheres.join(' AND ');
            dataQuery += where;
            countQuery += where;
        }

        dataQuery += ' ORDER BY f.created_at DESC';
        const countParams = [...params];

        dataQuery += ` LIMIT $${idx} OFFSET $${idx + 1}`;
        params.push(limitNum, offset);

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
        console.error('Error fetching efiling files:', error);
        return apiError(res, error);
    } finally {
        if (client) client.release();
    }
});

// POST /api/efiling/files
router.post('/', async (req, res) => {
    // TODO: Full migration from app/api/efiling/files/route.js POST handler
    return apiError(res, { message: 'Not yet migrated — copy POST logic from app/api/efiling/files/route.js', statusCode: 501 });
});

// PUT /api/efiling/files
router.put('/', async (req, res) => {
    // TODO: Full migration from app/api/efiling/files/route.js PUT handler
    return apiError(res, { message: 'Not yet migrated', statusCode: 501 });
});

module.exports = router;
