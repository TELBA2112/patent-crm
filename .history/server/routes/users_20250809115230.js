const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
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
    res.status(201).json({ message: 'Foydalanuvchi yaratildi' });
  } catch (err) {
    res.status(500).json({ message: 'Foydalanuvchini yaratishda xatolik' });
  }
});

// GET: Joriy foydalanuvchi profili
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// POST: Foydalanuvchi avatari yuklash
router.post('/:id/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.params.id;

    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Foydalanuvchini o‘zgartirishga ruxsat yo‘q' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });

    if (user.avatar) {
      const oldPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.avatar = req.file.path;
    await user.save();

    res.json({ message: 'Avatar yuklandi', avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ message: 'Xatolik yuz berdi' });
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

// PUT: Foydalanuvchi balansini o‘zgartirish (faqat admin)
router.put('/:id/balance', authenticate, isAdmin, async (req, res) => {
  try {
    const { amount } = req.body;

    if (typeof amount !== 'number') {
      return res.status(400).json({ message: 'amount raqam bo‘lishi kerak' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });

    user.balance = (user.balance || 0) + amount;
    await user.save();

    res.json({ message: 'Balans yangilandi', balance: user.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Balansni yangilashda xatolik' });
  }
});

module.exports = router;
