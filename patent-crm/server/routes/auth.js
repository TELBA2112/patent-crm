const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// LOGIN
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({ token, user: { id: user._id, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// TEMP: Admin user yaratish uchun
router.post('/register-admin', async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashed, role: 'admin' });
  await newUser.save();
  res.json({ message: 'Admin created' });
});

module.exports = router;
