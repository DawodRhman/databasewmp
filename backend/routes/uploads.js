// ─── Uploads Routes ────────────────────────────────────────────────────────
// Serve uploaded files. Converted from app/api/uploads/[...path]/route.js
// ────────────────────────────────────────────────────────────────────────────
const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const mime = require('path'); // Use path.extname for mime guessing
const { optionalAuth } = require('../middleware/auth');

// Serve files from uploads directory
router.get('/*', optionalAuth, (req, res) => {
    try {
        const requestedPath = req.params[0] || '';
        const safePath = path.normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, '');
        const fullPath = path.join(process.env.UPLOAD_DIR || './uploads', safePath);

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ success: false, error: { message: 'File not found' } });
        }

        // Set appropriate headers
        const ext = path.extname(fullPath).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.png': 'image/png', '.gif': 'image/gif',
            '.mp4': 'video/mp4', '.webm': 'video/webm',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        // Allow embedding PDFs and images in iframes
        if (ext === '.pdf') {
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        }

        res.sendFile(path.resolve(fullPath));
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).json({ success: false, error: { message: 'Error serving file' } });
    }
});

module.exports = router;
