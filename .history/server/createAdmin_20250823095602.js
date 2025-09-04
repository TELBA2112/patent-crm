// server/createAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// MongoDB ulanish
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/patent-db')
  .then(async () => {
    const existing = await User.findOne({ username: 'admin' });
    if (existing) {
      console.log('❗ Admin foydalanuvchi allaqachon mavjud.');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await User.create({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
    });

    console.log('✅ Admin foydalanuvchi yaratildi: admin / admin123');
    process.exit();
  })
  .catch((err) => {
    console.error('❌ MongoDB ulanib bo‘lmadi:', err.message);
  });
