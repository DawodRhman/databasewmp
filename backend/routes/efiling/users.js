// --- E-Filing: users ---
const router = require('express').Router();
const { connectToDatabase, query } = require('../../lib/db');
const { apiResponse, apiError } = require('../../lib/apiResponse');

// GET /api/efiling/users/profile?userId=X
router.get('/profile', async (req, res) => {
  let client;
  try {
    const userId = req.query.userId || req.user?.id;
    if (!userId) {
      return apiError(res, { message: 'userId is required', statusCode: 400 });
    }

    client = await connectToDatabase();
    const result = await client.query(
      `SELECT eu.id as efiling_user_id, eu.user_id, eu.employee_id,
              eu.designation, eu.department_id, eu.efiling_role_id,
              eu.supervisor_id, eu.is_active,
              u.name, u.email, u.image, u.role,
              r.name as role_name, r.code as role_code,
              d.name as department_name
       FROM efiling_users eu
       JOIN users u ON eu.user_id = u.id
       LEFT JOIN efiling_roles r ON eu.efiling_role_id = r.id
       LEFT JOIN efiling_departments d ON eu.department_id = d.id
       WHERE eu.user_id = $1 AND eu.is_active = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      return apiError(res, { message: 'E-Filing profile not found', statusCode: 404 });
    }

    return apiResponse(res, { user: result.rows[0] });
  } catch (error) {
    console.error('Error fetching efiling user profile:', error);
    return apiError(res, error);
  } finally {
    if (client) client.release();
  }
});

router.get('/', async (req, res) => {
  // TODO: Copy GET logic from app/api/efiling/users/route.js
  return apiError(res, { message: 'Not yet migrated - efiling/users GET', statusCode: 501 });
});

router.post('/', async (req, res) => {
  // TODO: Copy POST logic from app/api/efiling/users/route.js
  return apiError(res, { message: 'Not yet migrated - efiling/users POST', statusCode: 501 });
});

router.put('/', async (req, res) => {
  // TODO: Copy PUT logic from app/api/efiling/users/route.js
  return apiError(res, { message: 'Not yet migrated - efiling/users PUT', statusCode: 501 });
});

router.delete('/', async (req, res) => {
  // TODO: Copy DELETE logic from app/api/efiling/users/route.js
  return apiError(res, { message: 'Not yet migrated - efiling/users DELETE', statusCode: 501 });
});

module.exports = router;
