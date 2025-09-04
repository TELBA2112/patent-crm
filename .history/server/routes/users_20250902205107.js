const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { authenticate, isAdmin } = require('../middleware/auth');

// Test endpointi - autentifikatsiya talab qilinmaydi
router.get('/test', (req, res) => {
  res.json({ message: 'Users router ishlayapti!' });
});

// GET: Foydalanuvchilar ro'yxati (token talab qilinadi, role bo'yicha filter)
router.get('/', authenticate, async (req, res) => {
  console.log('GET /api/users endpointi chaqirildi');
  console.log('Query parametrlari:', req.query);
  
  try {
    const role = req.query.role;
    const query = role ? { role } : {};
    
    console.log('MongoDB so\'rovi:', query);
    const users = await User.find(query).select('-password');
    
    console.log(`${users.length} foydalanuvchi topildi`);
    res.json(users);
  } catch (err) {
    console.error('Foydalanuvchilarni olishda xatolik:', err);
    res.status(500).json({ message: 'Foydalanuvchilarni olishda xatolik', error: err.message });
  }
});

// POST: Yangi foydalanuvchi yaratish (faqat admin)
router.post('/', authenticate, isAdmin, async (req, res) => {
  console.log('POST /api/users endpointi chaqirildi');
  console.log('So\'rov ma\'lumotlari:', req.body);
  
  try {
    const { username, password, role, firstName, lastName } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Barcha majburiy maydonlar to\'ldirilishi shart' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu login mavjud' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      role,
      firstName,
      lastName,
    });
    
    await newUser.save();
    console.log('Yangi foydalanuvchi yaratildi:', newUser._id);
    res.status(201).json({ message: 'Foydalanuvchi muvaffaqiyatli yaratildi', user: { _id: newUser._id, username, role } });
  } catch (err) {
    console.error('Foydalanuvchi yaratishda xatolik:', err);
    res.status(500).json({ message: 'Foydalanuvchini yaratishda xatolik', error: err.message });
  }
});

// PUT: Foydalanuvchini yangilash (faqat admin)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { username, password, role, firstName, lastName } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });

    if (username) user.username = username;
    if (role) user.role = role;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;

    if (password && password.trim() !== '') {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ message: 'Foydalanuvchi yangilandi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Foydalanuvchini yangilashda xatolik' });
  }
});

// PUT: Foydalanuvchi balansini yangilash (faqat admin)
router.put('/:id/balance', authenticate, isAdmin, async (req, res) => {
  try {
    const { amount } = req.body;
    if (typeof amount !== 'number') {
      return res.status(400).json({ message: 'amount son bo‘lishi kerak' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    user.balance = (user.balance || 0) + amount;
    await user.save();
    res.json({ message: 'Balans yangilandi', balance: user.balance });
  } catch (err) {
    console.error('Balansni yangilashda xatolik:', err);
    res.status(500).json({ message: 'Balansni yangilashda xatolik' });
  }
});

// DELETE: Foydalanuvchini o‘chirish (faqat admin)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });

    res.json({ message: 'Foydalanuvchi o‘chirildi' });
  } catch (err) {
    res.status(500).json({ message: 'Foydalanuvchini o‘chirishda xatolik' });
  }
});

// GET: O'z profilini olish
router.get('/me', authenticate, async (req, res) => {
  console.log('GET /api/users/me endpointi chaqirildi');
  console.log('Foydalanuvchi ID:', req.user.id);
  
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('Foydalanuvchi topilmadi:', req.user.id);
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }
    
    console.log('Foydalanuvchi profili topildi');
    res.json(user);
  } catch (err) {
    console.error('Profilni olishda xatolik:', err);
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Default xatolik qaytarish
router.use((req, res) => {
  res.status(404).json({ message: 'Bu yo\'l mavjud emas' });
});

module.exports = router;