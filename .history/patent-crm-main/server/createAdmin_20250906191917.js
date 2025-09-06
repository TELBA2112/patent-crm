const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/patent-db';

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    const existing = await User.findOne({ username: 'admin' });
    if (existing) {
      console.log('ℹ️ Admin foydalanuvchi allaqachon mavjud');
      return;
    }
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', password: hashedPassword, role: 'admin' });
    console.log('✅ Admin foydalanuvchi yaratildi: admin / admin123');
  } catch (e) {
    console.error('❌ Admin yaratishda xatolik:', e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
