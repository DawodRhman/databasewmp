// ─── Standard API Response Helpers ──────────────────────────────────────────
// Express-compatible replacements for the NextResponse-based originals.
// Keep the same { success, data, meta } / { success, error } envelope format
// so the frontend ApiClient continues to work without changes.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Send a success response.
 */
function apiResponse(res, data, meta = null, status = 200) {
    const body = { success: true, data };
    if (meta) {
        if (meta.page && meta.limit && meta.total && !meta.totalPages) {
            meta.totalPages = Math.ceil(meta.total / meta.limit);
        }
        body.meta = meta;
    }
    return res.status(status).json(body);
}

/**
 * Send an error response.
 */
function apiError(res, error, status = null) {
    const statusCode = status || error.statusCode || 500;
    const code = error.code || 'INTERNAL_ERROR';
    const message =
        statusCode === 500 && process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : error.message || 'An unexpected error occurred';
    const details = error.details || null;

    return res.status(statusCode).json({
        success: false,
        error: { code, message, ...(details ? { details } : {}) },
    });
}

// ─── Custom Error Classes (same as original) ──────────────────────────────

class ValidationError extends Error {
    constructor(message, details = null) {
        super(message);
        this.name = 'ValidationError';
        this.code = 'VALIDATION_ERROR';
        this.statusCode = 400;
        this.details = details;
    }
}

class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
        this.code = 'UNAUTHORIZED';
        this.statusCode = 401;
    }
}

class ForbiddenError extends Error {
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
        this.code = 'FORBIDDEN';
        this.statusCode = 403;
    }
}

class NotFoundError extends Error {
    constructor(message = 'Not found') {
        super(message);
        this.name = 'NotFoundError';
        this.code = 'NOT_FOUND';
        this.statusCode = 404;
    }
}

class ConflictError extends Error {
    constructor(message = 'Conflict') {
        super(message);
        this.name = 'ConflictError';
        this.code = 'CONFLICT';
        this.statusCode = 409;
    }
}

module.exports = {
    apiResponse,
    apiError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
};
