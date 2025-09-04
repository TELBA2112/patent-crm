/**
 * Auth va MongoDB diagnostika skripti
 * Ishlatish: node check-auth.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

async function testConnection() {
  console.log('=== SERVER DIAGNOSTIKA SKRIPTI ===');
  console.log('\n1. .env faylini tekshirish:');
  console.log('  MONGO_URI:', process.env.MONGO_URI ? '✅ Mavjud' : '❌ Mavjud emas');
  console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ Mavjud' : '❌ Mavjud emas');
  console.log('  PORT:', process.env.PORT || '5000 (default)');

  try {
    console.log('\n2. MongoDB ga ulanish:');
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('  ✅ MongoDB ga ulanish muvaffaqiyatli');

    console.log('\n3. Admin mavjudligini tekshirish:');
    const admin = await User.findOne({ username: 'admin' });
    
    if (!admin) {
      console.log('  ❌ Admin foydalanuvchi topilmadi!');
      console.log('  ⚠️ Admin yaratilsin? (y/n)');
      
      // Agar stdout interfaol bo'lsa, admin yaratishga imkon berish
      if (process.stdin.isTTY) {
        process.stdin.once('data', async (data) => {
          const input = data.toString().trim().toLowerCase();
          if (input === 'y') {
            try {
              const hashedPassword = await bcrypt.hash('admin123', 10);
              const newAdmin = new User({
                username: 'admin',
                password: hashedPassword,
                role: 'admin',
                firstName: 'Admin',
                lastName: 'User'
              });
              
              await newAdmin.save();
              console.log('  ✅ Admin muvaffaqiyatli yaratildi: admin/admin123');
            } catch (err) {
              console.error('  ❌ Admin yaratishda xatolik:', err);
            }
          }
          mongoose.connection.close();
          process.exit();
        });
      } else {
        console.log('  ℹ️ Admin yaratish uchun: node createAdmin.js');
      }
    } else {
      console.log('  ✅ Admin foydalanuvchi mavjud');
      console.log('  Username:', admin.username);
      console.log('  Role:', admin.role);
      
      // Parol test qilish
      try {
        const isMatch = await bcrypt.compare('admin123', admin.password);
        console.log('  Default parol (admin123) to\'g\'ri:',  isMatch ? '✅ Ha' : '❌ Yo\'q');
      } catch (err) {
        console.log('  ❌ Parolni tekshirishda xatolik:', err.message);
      }
      
      // JWT test
      try {
        console.log('\n4. JWT token yaratish testi:');
        const token = jwt.sign(
          { id: admin._id, username: admin.username, role: admin.role },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        console.log('  ✅ JWT token muvaffaqiyatli yaratildi');
        
        // Tokenni tekshirish
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('  ✅ JWT token tekshirildi:', decoded.username);
      } catch (err) {
        console.error('  ❌ JWT xatolik:', err.message);
      }
      
      console.log('\n5. Login ma\'lumotlari:');
      console.log('  Username: admin');
      console.log('  Password: admin123');
      console.log('  Login URL: http://localhost:5000/api/auth/login');
      console.log('  Method: POST');
      console.log('  Body: { "username": "admin", "password": "admin123" }');
      
      console.log('\n✅ Barcha tekshirishlar tugadi.');
      mongoose.connection.close();
    }
  } catch (err) {
    console.error('\n❌ XATOLIK:', err.message);
    console.log('\nYechim bo\'yicha tavsiyalar:');
    console.log('1. MongoDB serverining ishga tushganini tekshiring');
    console.log('2. .env faylidagi MONGO_URI manzilini tekshiring');
    console.log('3. Server ishga tushgan bo\'lsa, uni qayta ishga tushiring');
    process.exit(1);
  }
}

testConnection();
