const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { authenticate, isAdmin } = require('../middleware/auth');

// GET: Foydalanuvchilar ro‘yxati (token talab qilinadi, role bo‘yicha filter)
router.get('/', authenticate, async (req, res) => {
  try {
    const role = req.query.role;
    const query = role ? { role } : {};
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Foydalanuvchilarni olishda xatolik' });
  }
});

// POST: Yangi foydalanuvchi yaratish (faqat admin)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { username, password, role, firstName, lastName } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Barcha maydonlar to‘ldirilishi shart' });
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
    res.status(201).json({ message: 'Foydalanuvchi muvaffaqiyatli yaratildi' });
  } catch (err) {
    console.error('Foydalanuvchi yaratishda xatolik:', err);
    res.status(500).json({ message: 'Foydalanuvchini yaratishda xatolik' });
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
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi' });
  }
});

module.exports = router;