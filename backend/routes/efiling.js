// ─── E-Filing Routes (Main Router) ─────────────────────────────────────────
// The e-filing system is a large sub-application with 30+ route groups.
// Each group is in its own sub-file under routes/efiling/
// ────────────────────────────────────────────────────────────────────────────

const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');

// All efiling routes require authentication
router.use(requireAuth);

// Mount sub-routers
router.use('/categories', require('./efiling/categories'));
router.use('/daak', require('./efiling/daak'));
router.use('/dashboard', require('./efiling/dashboard'));
router.use('/departments', require('./efiling/departments'));
router.use('/divisions', require('./efiling/divisions'));
router.use('/file-categories', require('./efiling/fileCategories'));
router.use('/file-status', require('./efiling/fileStatus'));
router.use('/file-types', require('./efiling/fileTypes'));
router.use('/files', require('./efiling/files'));
router.use('/google-auth', require('./efiling/googleAuth'));
router.use('/log-action', require('./efiling/logAction'));
router.use('/meetings', require('./efiling/meetings'));
router.use('/notifications', require('./efiling/notifications'));
router.use('/permissions', require('./efiling/permissions'));
router.use('/reports', require('./efiling/reports'));
router.use('/role-groups', require('./efiling/roleGroups'));
router.use('/roles', require('./efiling/roles'));
router.use('/send-otp', require('./efiling/sendOtp'));
router.use('/signatures', require('./efiling/signatures'));
router.use('/sla', require('./efiling/sla'));
router.use('/sla-policies', require('./efiling/slaPolicies'));
router.use('/status', require('./efiling/status'));
router.use('/teams', require('./efiling/teams'));
router.use('/templates', require('./efiling/templates'));
router.use('/user-actions', require('./efiling/userActions'));
router.use('/users', require('./efiling/users'));
router.use('/verify-auth', require('./efiling/verifyAuth'));
router.use('/workflow-templates', require('./efiling/workflowTemplates'));
router.use('/workflows', require('./efiling/workflows'));
router.use('/zones', require('./efiling/zones'));

module.exports = router;
