/**
 * Login jarayonini testdan o'tkazish uchun skript
 * 
 * Ishga tushirish: node test-auth.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

async function testAuthentication() {
  console.log('=== AUTH TEST STARTED ===');
  
  try {
    // MongoDB ga ulanish
    console.log('MongoDB ga ulanish...');
    console.log('MONGO_URI:', process.env.MONGO_URI || 'Not set!');
    
    // Ulanish variantlarini sinab ko'rish
    let connected = false;
    let connectionError = null;
    
    // 1. .env fayl orqali ulanishga urinish
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ MongoDB ulandi: ' + process.env.MONGO_URI);
      connected = true;
    } catch (err) {
      console.log(`❌ ${process.env.MONGO_URI} ga ulanib bo'lmadi: ${err.message}`);
      connectionError = err;
    }
    
    // 2. Localhost orqali ulanishga urinish
    if (!connected) {
      try {
        await mongoose.connect('mongodb://localhost:27017/patent-db');
        console.log('✅ MongoDB ulandi: localhost:27017');
        connected = true;
      } catch (err) {
        console.log(`❌ localhost:27017 ga ulanib bo'lmadi: ${err.message}`);
      }
    }
    
    // 3. Localhost IP orqali ulanishga urinish
    if (!connected) {
      try {
        await mongoose.connect('mongodb://127.0.0.1:27017/patent-db');
        console.log('✅ MongoDB ulandi: 127.0.0.1:27017');
        connected = true;
      } catch (err) {
        console.log(`❌ 127.0.0.1:27017 ga ulanib bo'lmadi: ${err.message}`);
      }
    }
    
    if (!connected) {
      throw connectionError || new Error('MongoDB ga ulanishning barcha usullari muvaffaqiyatsiz tugadi');
    }
    
    // Admin foydalanuvchisi borligini tekshirish
    const adminUser = await User.findOne({ username: 'admin' });
    console.log('Admin foydalanuvchisi mavjud:', adminUser ? 'Ha ✅' : 'Yo\'q ❌');
    
    if (adminUser) {
      // Admin foydalanuvchisi ma'lumotlari
      console.log('Admin ID:', adminUser._id);
      console.log('Admin role:', adminUser.role);
      
      // Parolni tekshirish
      const testPassword = 'admin123';
      const passwordMatch = await bcrypt.compare(testPassword, adminUser.password);
      console.log('Parol tekshiruvi:', passwordMatch ? 'To\'g\'ri ✅' : 'Noto\'g\'ri ❌');
      
      // JWT yaratishni sinash
      const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
      console.log('JWT Secret:', jwtSecret ? 'Mavjud ✅' : 'Yo\'q ❌');
      
      const token = jwt.sign({ id: adminUser._id, username: adminUser.username, role: adminUser.role }, jwtSecret, { expiresIn: '1d' });
      console.log('Token yaratildi:', token.substring(0, 20) + '...');
      
      // Tokenni tekshirish
      try {
        const decoded = jwt.verify(token, jwtSecret);
        console.log('Token tekshirildi ✅');
        console.log('Token ma\'lumotlari:', decoded);
      } catch (err) {
        console.error('Token tekshirishda xatolik ❌:', err);
      }
    } else {
      console.log('⚠️ Admin foydalanuvchisi topilmadi, yangi admin yaratilmoqda...');
      
      // Yangi admin yaratish
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = new User({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User'
      });
      
      await newAdmin.save();
      console.log('✅ Yangi admin yaratildi!');
      console.log('Admin ma\'lumotlari:');
      console.log('  Username: admin');
      console.log('  Password: admin123');
      console.log('  Role: admin');
    }
  } catch (err) {
    console.error('❌ AUTH TEST ERROR:', err);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('MongoDB uzildi');
    }
    console.log('=== AUTH TEST FINISHED ===');
  }
}

testAuthentication();
