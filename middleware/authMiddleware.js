const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
  console.log('Auth middleware - Headers:', req.headers);
  console.log('Auth middleware - Authorization header:', req.headers['authorization']);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('Auth middleware - Extracted token:', token);
  console.log('Auth middleware - Token exists:', !!token);
  
  if (!token) {
    console.log('Auth middleware - No token found, returning 401');
    return res.status(401).json({ error: 'Token missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      console.log('JWT verification error:', err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.log('JWT verification successful, user payload:', user);
    // user contains the payload we signed: { userId, username, role }
    req.user = {
      id: user.userId, // Map userId to id for consistency
      userId: user.userId, // Keep userId for backward compatibility
      username: user.username,
      role: user.role
    };
    console.log('Set req.user:', req.user);
    next();
  });
}

module.exports = authenticateToken; 