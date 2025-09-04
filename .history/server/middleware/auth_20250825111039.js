const jwt = require('jsonwebtoken');

// Authenticate middleware - token tekshirish
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Avtorizatsiya tokeni mavjud emas' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth middleware xatoligi:', err);
    return res.status(401).json({ message: 'Noto\'g\'ri yoki muddati tugagan token' });
  }
};

// Admin ekanligini tekshirish middleware
const isAdmin = (req, res, next) => {
  try {
    // authenticate middleware allaqachon ishlatilgan bo'lishi kerak
    if (!req.user) {
      return res.status(401).json({ message: 'Avtorizatsiyadan o\'tilmagan' });
    }
    
    // Foydalanuvchi admin ekanligini tekshirish
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu amalni bajarish uchun admin huquqi kerak' });
    }
    
    next();
  } catch (err) {
    console.error('Admin tekshiruvida xatolik:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
};

module.exports = { authenticate, isAdmin };
