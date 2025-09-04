const jwt = require('jsonwebtoken');

// Authenticate middleware - token tekshirish uchun
exports.authenticate = (req, res, next) => {
  try {
    console.log('Authentication boshlandi');
    
    // Authorization headerini tekshirish
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('Authorization header topilmadi');
      return res.status(401).json({ message: 'Autentifikatsiya tokeni yo\'q' });
    }
    
    // "Bearer " prefiksi bor-yo'qligini tekshirish
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Noto\'g\'ri token formati');
      return res.status(401).json({ message: 'Noto\'g\'ri token formati' });
    }
    
    // Tokenni ajratib olish
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Token mavjud emas');
      return res.status(401).json({ message: 'Token mavjud emas' });
    }
    
    // Tokenni tekshirish va decode qilish
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Foydalanuvchi ma'lumotlarini req obyektiga qo'shish
    req.user = decoded;
    
    console.log('Authentication muvaffaqiyatli:', req.user.username, req.user.role);
    next();
  } catch (err) {
    console.error('Authentication xatoligi:', err.message);
    return res.status(401).json({ message: 'Noto\'g\'ri yoki eskirgan token' });
  }
};

function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Faqat adminlar uchun ruxsat beriladi' });
  }
  next();
}

module.exports = { authenticate, isAdmin };
