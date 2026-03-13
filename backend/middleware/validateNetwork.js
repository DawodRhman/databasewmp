// ─── Network Validation Middleware ─────────────────────────────────────────
// Validates that incoming requests originate from trusted frontend/network IPs.
// Adds an extra layer of security beyond CORS.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Validate request comes from an allowed network.
 * Checks X-Forwarded-For (behind nginx/LB) and direct IP.
 * 
 * Usage in server.js:
 *   app.use('/api', validateNetwork);
 */
function validateNetwork(req, res, next) {
    // Skip in development
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }

    // Skip health checks (for monitoring tools)
    if (req.path === '/health' || req.path === '/api/health') {
        return next();
    }

    const allowedNetworks = (process.env.ALLOWED_NETWORKS || '')
        .split(',')
        .map(n => n.trim())
        .filter(Boolean);

    // If no ALLOWED_NETWORKS configured, rely on CORS only
    if (allowedNetworks.length === 0) {
        return next();
    }

    const clientIp = getClientIp(req);

    // Always allow localhost
    const localhostIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    if (localhostIps.includes(clientIp)) {
        return next();
    }

    // Check if client IP is in allowed networks
    const isAllowed = allowedNetworks.some(network => {
        if (network.includes('/')) {
            // CIDR notation: 10.0.1.0/24
            return isIpInCidr(clientIp, network);
        }
        // Exact IP match
        return clientIp === network || clientIp === `::ffff:${network}`;
    });

    if (!isAllowed) {
        console.warn(`[NETWORK] Blocked request from ${clientIp} to ${req.method} ${req.originalUrl}`);
        return res.status(403).json({
            success: false,
            error: {
                code: 'NETWORK_FORBIDDEN',
                message: 'Request not allowed from this network',
            },
        });
    }

    next();
}

/**
 * Extract real client IP, respecting reverse proxy headers.
 */
function getClientIp(req) {
    // Trust X-Forwarded-For only if behind a known proxy
    if (process.env.TRUST_PROXY === 'true') {
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        if (req.headers['x-real-ip']) {
            return req.headers['x-real-ip'].trim();
        }
    }
    return req.ip || req.connection?.remoteAddress || '';
}

/**
 * Check if an IP falls within a CIDR range.
 * Supports IPv4 only (e.g., 10.0.1.0/24).
 */
function isIpInCidr(ip, cidr) {
    // Strip ::ffff: prefix for IPv4-mapped IPv6
    const cleanIp = ip.replace(/^::ffff:/, '');
    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);

    const ipNum = ipToNumber(cleanIp);
    const rangeNum = ipToNumber(range);

    if (ipNum === null || rangeNum === null) return false;
    return (ipNum & mask) === (rangeNum & mask);
}

function ipToNumber(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return null;
    return parts.reduce((sum, part) => (sum << 8) + parseInt(part), 0) >>> 0;
}

module.exports = {
    validateNetwork,
    getClientIp,
};
