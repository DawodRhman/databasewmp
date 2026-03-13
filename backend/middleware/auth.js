// ─── Authentication Middleware ──────────────────────────────────────────────
// Express middleware that validates JWT from Authorization header or cookie.
// Attaches req.user on success.
// ────────────────────────────────────────────────────────────────────────────

const { verifyToken } = require('../lib/auth');
const { UnauthorizedError, ForbiddenError } = require('../lib/apiResponse');

/**
 * Require a valid JWT token. Populates req.user.
 */
function requireAuth(req, res, next) {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
            });
        }

        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: { code: 'TOKEN_EXPIRED', message: 'Token expired, please login again' },
            });
        }
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
        });
    }
}

/**
 * Optional auth — populates req.user if token present, but doesn't block.
 */
function optionalAuth(req, res, next) {
    try {
        const token = extractToken(req);
        if (token) {
            req.user = verifyToken(token);
        }
    } catch {
        // Token invalid — proceed without user
        req.user = null;
    }
    next();
}

/**
 * Require admin role (role 1 or 2).
 */
function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        const isAdmin = [1, 2].includes(parseInt(req.user.role));
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'Admin access required' },
            });
        }
        next();
    });
}

/**
 * Require specific role(s). Usage: requireRole(1, 2, 3)
 */
function requireRole(...roles) {
    return (req, res, next) => {
        requireAuth(req, res, () => {
            if (!roles.includes(parseInt(req.user.role))) {
                return res.status(403).json({
                    success: false,
                    error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
                });
            }
            next();
        });
    };
}

/**
 * Check if user owns a resource or is admin.
 */
function checkOwnership(userId, resourceUserId, isAdmin = false) {
    if (isAdmin) return true;
    return parseInt(userId) === parseInt(resourceUserId);
}

// ─── Token Extraction ──────────────────────────────────────────────────────

function extractToken(req) {
    // 1. Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // 2. Cookie: token=<jwt>
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }

    // 3. Query parameter (for file downloads, etc.)
    if (req.query && req.query.token) {
        return req.query.token;
    }

    return null;
}

module.exports = {
    requireAuth,
    optionalAuth,
    requireAdmin,
    requireRole,
    checkOwnership,
};
