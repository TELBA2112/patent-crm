const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Xatoliklarni qayta ishlash uchun yordamchi funksiya
const handleError = (err, res) => {
  console.error('AUTH ERROR:', err);
  return res.status(500).json({ message: 'Serverda xatolik yuz berdi', error: err.message });
};

// Login endpointi
router.post('/login', async (req, res) => {
  console.log('\n=== LOGIN ATTEMPT ===');
  console.log('Body:', req.body);
  
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Login xatosi: Login yoki parol kiritilmagan');
      return res.status(400).json({ message: 'Login va parol kiritilishi shart' });
    }

    // Foydalanuvchini bazadan qidirish
    const user = await User.findOne({ username });
    console.log('Foydalanuvchi topildi:', user ? 'Ha' : 'Yo\'q');
    
    if (!user) {
      return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri' });
    }

    // Parolni tekshirish
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Parol mos keldi:', isMatch ? 'Ha' : 'Yo\'q');
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri' });
    }

    // JWT Secret tekshirish
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
    console.log('JWT Secret mavjud:', !!jwtSecret);
    
    if (!jwtSecret) {
      return res.status(500).json({ message: 'Server konfiguratsiyasida xatolik' });
    }

    // Token yaratish
    const payload = {
      id: user._id,
      username: user.username,
      role: user.role
    };
    
    console.log('Token payload:', payload);
    
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1d' });
    console.log('Token yaratildi, uzunlik:', token.length);

    // Muvaffaqiyatli javob
    console.log('LOGIN SUCCESS');
    return res.json({
      message: 'Tizimga muvaffaqiyatli kirildi',
      token,
      role: user.role,
      userId: user._id,
      username: user.username
    });
    
  } catch (err) {
    return handleError(err, res);
  }
});

// Test endpointi - serverning ishlayotganini tekshirish uchun
router.get('/test', (req, res) => {
  res.json({ message: 'Auth router ishlayapti', time: new Date().toISOString() });
});

module.exports = router;
