const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Token yo‘q' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token noto‘g‘ri formatda' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token yaroqsiz yoki muddati o‘tgan' });
  }
}

function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Faqat adminlar uchun ruxsat beriladi' });
  }
  next();
}

module.exports = { authenticate, isAdmin };
