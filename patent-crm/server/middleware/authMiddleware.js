// middleware/authMiddleware.js

module.exports = (req, res, next) => {
  // Bu yerga autentifikatsiya tekshiruvi yoziladi
  // Misol uchun oddiy token tekshirish:
req.user = { role: 'operator' }; // yoki 'checker', 'lawyer' - test uchun
  next();
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Tokenni tekshirish va user ma'lumotini req.user ga yozish
  // Bu yerda siz JWT yoki boshqa usul bilan tekshirishingiz mumkin

  try {
    // Masalan, JWT tekshiruv:
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // token ichidagi user ma'lumotlari
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
