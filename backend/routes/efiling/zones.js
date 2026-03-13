// --- E-Filing: zones ---
// TODO: Migrate from app/api/efiling/zones/route.js
const router = require('express').Router();
const { connectToDatabase, query } = require('../../lib/db');
const { apiResponse, apiError } = require('../../lib/apiResponse');

router.get('/', async (req, res) => {
  // TODO: Copy GET logic from app/api/efiling/zones/route.js
  return apiError(res, { message: 'Not yet migrated - efiling/zones GET', statusCode: 501 });
});

router.post('/', async (req, res) => {
  // TODO: Copy POST logic from app/api/efiling/zones/route.js
  return apiError(res, { message: 'Not yet migrated - efiling/zones POST', statusCode: 501 });
});

router.put('/', async (req, res) => {
  // TODO: Copy PUT logic from app/api/efiling/zones/route.js
  return apiError(res, { message: 'Not yet migrated - efiling/zones PUT', statusCode: 501 });
});

router.delete('/', async (req, res) => {
  // TODO: Copy DELETE logic from app/api/efiling/zones/route.js
  return apiError(res, { message: 'Not yet migrated - efiling/zones DELETE', statusCode: 501 });
});

module.exports = router;
