const jwt = require('jsonwebtoken');

// Authenticate middleware - token tekshirish uchun
const authenticate = (req, res, next) => {
  console.log('\n=== AUTHENTICATION CHECK ===');
  console.log('So\'rov:', req.method, req.url);
  
  try {
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader);
    
    if (!authHeader) {
      console.log('XATOLIK: Authorization header mavjud emas');
      return res.status(401).json({ message: 'Autentifikatsiya tokeni yo\'q' });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('XATOLIK: Noto\'g\'ri token formati');
      return res.status(401).json({ message: 'Noto\'g\'ri token formati' });
    }
    
    // Tokenni ajratib olish
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Token mavjud emas');
      return res.status(401).json({ message: 'Token mavjud emas' });
    }
    
    // Tokenni tekshirish va decode qilish
    console.log('JWT Secret:', process.env.JWT_SECRET || 'your_jwt_secret');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    console.log('Decoded token:', decoded);
    
    // Foydalanuvchi ma'lumotlarini req obyektiga qo'shish
    req.user = decoded;
    
    console.log('Authentication muvaffaqiyatli:', req.user.username, '(', req.user.role, ')');
    next();
  } catch (err) {
    console.error('Authentication xatoligi:', err.message);
    return res.status(401).json({ message: 'Noto\'g\'ri yoki eskirgan token' });
  }
};

// Admin rolini tekshiradigan middleware
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Faqat adminlar uchun ruxsat beriladi' });
  }
  next();
};

module.exports = { authenticate, isAdmin };
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Faqat adminlar uchun ruxsat beriladi' });
  }
  next();

module.exports = { authenticate, isAdmin };
