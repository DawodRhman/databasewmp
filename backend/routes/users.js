// ─── Users Routes ──────────────────────────────────────────────────────────
// Converted from app/api/users/route.js (Next.js) → Express router.
// GET    /api/users          → List users (with pagination & filters)
// GET    /api/users?id=X     → Get single user
// POST   /api/users          → Create user
// PUT    /api/users          → Update user
// DELETE /api/users          → Delete user
// GET    /api/users/me       → Current user info
// POST   /api/users/login    → Legacy login endpoint
// ────────────────────────────────────────────────────────────────────────────

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs/promises');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { connectToDatabase } = require('../lib/db');
const { apiResponse, apiError, NotFoundError, ForbiddenError, ValidationError } = require('../lib/apiResponse');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ─── File Upload Config ────────────────────────────────────────────────────
const uploadDir = path.join(process.env.UPLOAD_DIR || './uploads', 'users');
const upload = multer({
    storage: multer.diskStorage({
        destination: async (req, file, cb) => {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ─── GET /api/users ────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
    const { id, role, page = '1', limit = '0', filter, date_from, date_to } = req.query;
    const client = await connectToDatabase();
    try {
        if (id) {
            const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
            if (result.rows.length === 0) throw new NotFoundError('User not found');
            return apiResponse(res, result.rows[0]);
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;
        let countQuery = 'SELECT COUNT(*) FROM users';
        let dataQuery = 'SELECT id, name, email, contact_number, role, image, created_date FROM users';
        const whereClauses = [];
        const params = [];
        let paramIdx = 1;

        if (filter) {
            whereClauses.push(`(CAST(id AS TEXT) ILIKE $${paramIdx} OR name ILIKE $${paramIdx} OR email ILIKE $${paramIdx} OR contact_number ILIKE $${paramIdx})`);
            params.push(`%${filter}%`);
            paramIdx++;
        }
        if (role) { whereClauses.push(`role = $${paramIdx}`); params.push(role); paramIdx++; }
        if (date_from) { whereClauses.push(`created_date >= $${paramIdx}`); params.push(date_from); paramIdx++; }
        if (date_to) { whereClauses.push(`created_date <= $${paramIdx}`); params.push(date_to); paramIdx++; }

        if (whereClauses.length > 0) {
            const where = ' WHERE ' + whereClauses.join(' AND ');
            countQuery += where;
            dataQuery += where;
        }
        dataQuery += ' ORDER BY created_date DESC';
        const countParams = [...params];

        if (limitNum > 0) {
            dataQuery += ` LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
            params.push(limitNum, offset);
        }

        const countResult = await client.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count, 10);
        const result = await client.query(dataQuery, params);
        return apiResponse(res, result.rows, { page: pageNum, limit: limitNum, total });
    } catch (error) {
        console.error('Error fetching users:', error);
        return apiError(res, error);
    } finally {
        if (client) client.release();
    }
});

// ─── POST /api/users ───────────────────────────────────────────────────────
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
    const client = await connectToDatabase();
    try {
        const { name, email, password, contact, role } = req.body;
        const imageUrl = req.file ? `/uploads/users/${req.file.filename}` : null;
        const hashedPassword = await bcrypt.hash(password, 10);

        const { rows } = await client.query(
            `INSERT INTO users (name, email, password, contact_number, role, image)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, email, hashedPassword, contact, role, imageUrl]
        );

        return apiResponse(res, { user: rows[0] }, null, 201);
    } catch (error) {
        console.error('Error creating user:', error);
        return apiError(res, error);
    } finally {
        if (client) client.release();
    }
});

// ─── PUT /api/users ────────────────────────────────────────────────────────
router.put('/', requireAuth, upload.single('image'), async (req, res) => {
    const client = await connectToDatabase();
    try {
        const { id, name, email, contact, role, password } = req.body;

        // Authorization check
        const userId = parseInt(id);
        const isAdmin = [1, 2].includes(parseInt(req.user.role));
        if (parseInt(req.user.id) !== userId && !isAdmin) {
            throw new ForbiddenError('You can only modify your own data');
        }

        const currentResult = await client.query('SELECT id, image FROM users WHERE id = $1', [id]);
        if (currentResult.rows.length === 0) throw new NotFoundError('User not found');

        let imageUrl = currentResult.rows[0].image;
        if (req.file) {
            imageUrl = `/uploads/users/${req.file.filename}`;
        }

        let query, params;
        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            query = `UPDATE users SET name=$1,email=$2,contact_number=$3,role=$4,image=$5,password=$6,updated_date=CURRENT_TIMESTAMP WHERE id=$7 RETURNING *`;
            params = [name, email, contact, role, imageUrl, hashed, id];
        } else {
            query = `UPDATE users SET name=$1,email=$2,contact_number=$3,role=$4,image=$5,updated_date=CURRENT_TIMESTAMP WHERE id=$6 RETURNING *`;
            params = [name, email, contact, role, imageUrl, id];
        }

        const { rows } = await client.query(query, params);
        if (rows.length === 0) throw new NotFoundError('User not found');
        return apiResponse(res, rows[0]);
    } catch (error) {
        console.error('Error updating user:', error);
        return apiError(res, error);
    } finally {
        if (client) client.release();
    }
});

// ─── DELETE /api/users ─────────────────────────────────────────────────────
router.delete('/', requireAdmin, async (req, res) => {
    const client = await connectToDatabase();
    try {
        const { id } = req.body;
        if (!id) throw new ValidationError('User Id is required');

        const { rows } = await client.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        if (rows.length === 0) throw new NotFoundError('User not found');

        return apiResponse(res, rows[0]);
    } catch (error) {
        console.error('Error deleting user:', error);
        return apiError(res, error);
    } finally {
        if (client) client.release();
    }
});

// ─── GET /api/users/me ─────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
    const client = await connectToDatabase();
    try {
        const result = await client.query(
            'SELECT id, name, email, role, image, contact_number FROM users WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) throw new NotFoundError('User not found');
        return apiResponse(res, result.rows[0]);
    } catch (error) {
        return apiError(res, error);
    } finally {
        if (client) client.release();
    }
});

module.exports = router;
