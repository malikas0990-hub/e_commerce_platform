const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = payload; // { id, email, role, name }
    next();
  });
}

// Role-based access control. superadmin always passes (full control).
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || (req.user.role !== 'superadmin' && !roles.includes(req.user.role))) {
      return res.status(403).json({ error: 'Access denied (insufficient role)' });
    }
    next();
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { authenticateToken, authorizeRoles, signToken, JWT_SECRET };
