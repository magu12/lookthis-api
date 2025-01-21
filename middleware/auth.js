const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const accessToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!accessToken) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;