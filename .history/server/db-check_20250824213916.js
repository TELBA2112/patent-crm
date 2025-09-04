/**
 * MongoDB bilan ulanish va serverning holatini tekshirish uchun diagnostika skripti
 * Ishga tushirish: node db-check.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { exec } = require('child_process');
const fs = require('fs');

console.log('=== MongoDB Diagnostika Vositasi ===');
console.log('\n1. Muhit o\'zgaruvchilarini tekshirish:');
console.log('MONGO_URI:', process.env.MONGO_URI || 'Topilmadi');

// .env faylini tekshirish
try {
  const envContent = fs.readFileSync('.env', 'utf-8');
  console.log('\n2. .env faylining mazmuni:');
  console.log(envContent.replace(/JWT_SECRET=.*$/m, 'JWT_SECRET=********'));
} catch (err) {
  console.log('\n.env faylini o\'qishda xatolik:', err.message);
}

console.log('\n3. MongoDB holatini tekshirish:');

// MongoDB jarayonini tekshirish
exec('ps aux | grep mongo', (err, stdout) => {
  if (err) {
    console.log('MongoDB jarayonlarini tekshirishda xatolik:', err.message);
  } else {
    console.log('MongoDB jarayonlari:');
    console.log(stdout);
  }
  
  // MongoDB portini tekshirish
  exec('netstat -tulpn | grep 27017', (err, stdout) => {
    if (err) {
      console.log('MongoDB portini tekshirishda xatolik:', err.message);
    } else {
      console.log('\nMongoDB port holati (27017):');
      console.log(stdout || 'MongoDB 27017 portda topilmadi!');
    }
    
    // MongoDB ga ulanish
    console.log('\n4. MongoDB ga ulanish sinovi:');
    mongoose.connect(process.env.MONGO_URI, { 
      serverSelectionTimeoutMS: 5000  // 5 sekund kutish
    })
      .then(() => {
        console.log('✅ MongoDB ga ulanish muvaffaqiyatli!');
        console.log('\nMa\'lumotlar bazasi modellarini tekshirish:');
        
        // Ma'lumotlar bazasi jadvallarini tekshirish
        mongoose.connection.db.listCollections().toArray()
          .then(collections => {
            if (collections.length === 0) {
              console.log('⚠️ Ma\'lumotlar bazasida jadvallar mavjud emas!');
            } else {
              console.log('Mavjud jadvallar:');
              collections.forEach(collection => {
                console.log(`- ${collection.name}`);
              });
            }
            
            console.log('\n✅ Tekshirish tugadi. MongoDB ishlayapti.');
            mongoose.connection.close();
            process.exit(0);
          });
      })
      .catch(err => {
        console.error('❌ MongoDB ga ulanish sinovi muvaffaqiyatsiz tugadi!');
        console.error('Xatolik tafsilotlari:', err);
        console.log('\nYechim bo\'yicha tavsiyalar:');
        console.log('1. MongoDB servis ishga tushirilganligini tekshiring');
        console.log('   - Docker muhitida: `docker-compose up -d` buyrug\'ini ishga tushiring');
        console.log('   - Ubuntu: `sudo systemctl start mongod` buyrug\'ini ishga tushiring');
        console.log('2. Ulanish URL to\'g\'riligini tekshiring:');
        console.log('   - `.env` faylida to\'g\'ri qiymat: MONGO_URI=mongodb://localhost:27017/patent-db');
        console.log('   - Docker muhiti: MONGO_URI=mongodb://mongodb:27017/patent-db');
        process.exit(1);
      });
  });
});
