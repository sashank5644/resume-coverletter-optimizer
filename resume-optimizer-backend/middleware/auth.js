const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  //console.log('Received token:', token); // Debug log
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //console.log('Decoded token:', decoded); // Debug log
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message); // Detailed error log
    res.status(401).json({ msg: 'Token is not valid' });
  }
};