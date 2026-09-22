const jwt = require('jsonwebtoken');
const db = require('../db');

// ---------------------------------------------------------------------------
// JWT Secret — MUST come from the environment. No hardcoded fallback.
// ---------------------------------------------------------------------------
const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET) {
  if (isProduction) {
    console.error('[FATAL] JWT_SECRET environment variable is not set. Refusing to start in production.');
    process.exit(1);
  } else {
    console.warn('[WARN]  JWT_SECRET is not set. Set it in your .env file for local development.');
  }
}

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Authentication middleware for protecting private CMS routes
 */
function requireAuth(req, res, next) {
  try {
    let token = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      // Check HTTP-only cookie
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const stmt = db.prepare('SELECT id, username, email FROM admin_users WHERE id = ?');
    const user = stmt.get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

module.exports = {
  requireAuth,
  JWT_SECRET
};
