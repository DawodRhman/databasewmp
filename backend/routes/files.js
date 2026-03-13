// ─── Files Routes ──────────────────────────────────────────────────────────
const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const { apiError } = require('../lib/apiResponse');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// GET /api/files/serve?path=xxx — serve a file from uploads
router.get('/serve', optionalAuth, async (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) return res.status(400).json({ success: false, error: { message: 'Path required' } });

        const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
        const fullPath = path.join(process.env.UPLOAD_DIR || './uploads', safePath);

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ success: false, error: { message: 'File not found' } });
        }

        return res.sendFile(path.resolve(fullPath));
    } catch (error) {
        return apiError(res, error);
    }
});

module.exports = router;
