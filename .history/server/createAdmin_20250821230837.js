// server/createAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/patent-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const existing = await User.findOne({ username: 'admin' });
  if (existing) {
    console.log('❗ Admin foydalanuvchi allaqachon mavjud.');
    process.exit();
  }

  await User.create({
    username: 'admin',
    password: hashedPassword,
    role: 'admin',
  });

  console.log('✅ Admin foydalanuvchi yaratildi: admin / admin123');
  process.exit();
}).catch((err) => {
  console.error('MongoDB ulanib bo‘lmadi:', err);
});
