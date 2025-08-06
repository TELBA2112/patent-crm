const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { authMiddleware, isAdmin } = require('../middleware/auth');

// Admin yangi foydalanuvchi qo‘shadi
router.post('/create', authMiddleware, isAdmin, async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashed, role });
    await newUser.save();
    res.json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin barcha foydalanuvchilarni ko‘radi
router.get('/list', authMiddleware, isAdmin, async (req, res) => {
  const users = await User.find({}, { password: 0 });
  res.json(users);
});

module.exports = router;
