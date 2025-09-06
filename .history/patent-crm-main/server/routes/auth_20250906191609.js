const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Login endpointi - xatoliklarni tuzatish va ko'proq log yozish
router.post('/login', async (req, res) => {
  console.log('\n=== LOGIN ATTEMPT ===');
  console.log('Body:', JSON.stringify({...req.body, password: '****'}));
  
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Login xatosi: Login yoki parol kiritilmagan');
      return res.status(400).json({ message: 'Login va parol kiritilishi shart' });
    }

    // Foydalanuvchini bazadan qidirish
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log(`❌ Foydalanuvchi topilmadi: ${username}`);
      return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri' });
    } else {
      console.log(`✅ Foydalanuvchi topildi: ${user.username}, ID: ${user._id}, Role: ${user.role}`);
    }

    // Parolni tekshirish
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`🔐 Parol tekshiruvi: ${isMatch ? 'To\'g\'ri' : 'Noto\'g\'ri'}`);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri' });
    }

    // JWT Secret tekshirish
    const jwtSecret = process.env.JWT_SECRET;
    console.log(`🔑 JWT Secret mavjud: ${!!jwtSecret ? 'Ha' : 'Yo\'q'}`);
    
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET topilmadi. .env faylini tekshiring!');
      return res.status(500).json({ message: 'Server konfiguratsiyasida xatolik' });
    }

    // Token yaratish
    const payload = {
      id: user._id,
      username: user.username,
      role: user.role
    };
    
    console.log(`📝 Token payload: ${JSON.stringify(payload)}`);
    
    // Token yaratish, xatolikni ushlash uchun try-catch
    try {
      const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
      console.log(`🎫 Token yaratildi: ${token.substring(0, 20)}...`);
      
      // Muvaffaqiyatli javob
      console.log('✅ LOGIN SUCCESS');
      return res.json({
        message: 'Tizimga muvaffaqiyatli kirildi',
        token,
        role: user.role,
        userId: user._id,
        username: user.username
      });
    } catch (jwtError) {
      console.error('❌ JWT SIGN ERROR:', jwtError);
      return res.status(500).json({ message: 'Token yaratishda xatolik: ' + jwtError.message });
    }
    
  } catch (err) {
    console.error('❌ LOGIN ERROR:', err);
    return res.status(500).json({ message: 'Serverda xatolik yuz berdi', error: err.message });
  }
});

// Test endpointi - serverning ishlayotganini tekshirish uchun
router.get('/test', (req, res) => {
  res.json({ message: 'Auth router ishlayapti', time: new Date().toISOString() });
});

module.exports = router;
