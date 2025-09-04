/**
 * MongoDB ulanishini tekshirish uchun diagnostika skripti
 * 
 * Ishga tushirish: node mongo-diagnostika.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Muhit o'zgaruvchilarini tekshirish
console.log('\n=== MUHIT O\'ZGARUVCHILARI ===');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Mavjud' : '❌ Yo\'q');
console.log('NODE_ENV:', process.env.NODE_ENV || 'aniqlanmagan');

// MongoDB URI ni olish
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/patent-db';
console.log('\n=== MONGO URI ===');
console.log(mongoUri);

// URI analiz qilish
let protocol, auth, host, port, database;
try {
  const url = new URL(mongoUri);
  protocol = url.protocol;
  auth = url.username ? `${url.username}:${url.password ? '***' : 'no-password'}@` : 'none';
  host = url.hostname;
  port = url.port || '27017';
  database = url.pathname.slice(1) || 'none';
  
  console.log('\n=== URI TARKIBI ===');
  console.log('Protokol:', protocol);
  console.log('Autentifikatsiya:', auth !== 'none' ? 'mavjud' : 'yo\'q');
  console.log('Host:', host);
  console.log('Port:', port);
  console.log('Ma\'lumotlar bazasi:', database);
} catch (err) {
  console.error('\n❌ URI formatida xatolik:', err.message);
  console.log('To\'g\'ri format: mongodb://username:password@host:port/database');
}

// MongoDB serveriga ulanish
console.log('\n=== MONGODB GA ULANISH ===');
console.log('Ulanish boshlandi...');

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ MongoDB ga muvaffaqiyatli ulandik!');
    
    // Ma'lumotlar bazasidagi kolleksiyalarni tekshirish
    return mongoose.connection.db.collections();
  })
  .then(collections => {
    console.log('\n=== MA\'LUMOTLAR BAZASI TARKIBI ===');
    console.log(`Kolleksiyalar soni: ${collections.length}`);
    console.log('Kolleksiyalar ro\'yxati:');
    collections.forEach(collection => {
      console.log(`- ${collection.collectionName}`);
    });
    
    // Qo'shimcha test: Foydalanuvchilar kolleksiyasidan ma'lumot olish
    return mongoose.connection.db.collection('users').countDocuments();
  })
  .then(count => {
    console.log('\n=== FOYDALANUVCHILAR KOLLEKSIYASI ===');
    console.log(`Foydalanuvchilar soni: ${count}`);
    console.log('\n✅ MONGODB ULANISHI VA MA\'LUMOTLAR TEKSHIRUVI MUVAFFAQIYATLI!');
    
    // Ulanishni yopish
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error('\n❌ XATOLIK:', err);
    
    // Xatolikni tahlil qilish
    if (err.name === 'MongoServerSelectionError') {
      console.log('\n=== SERVER TANLOV XATOLIGI ===');
      console.log('Sabab: MongoDB server topilmadi yoki ulanish vaqti tugadi');
      console.log('\nMumkin bo\'lgan yechimlar:');
      console.log('1. MongoDB server ishga tushirilganligini tekshiring');
      console.log('2. Host va port to\'g\'ri ekanligini tekshiring');
      console.log('3. Firewall yoki tarmoq sozlamalarini tekshiring');
      console.log('4. MongoDB serviceni qayta ishga tushiring: `sudo service mongod restart`');
    } else if (err.name === 'MongoParseError') {
      console.log('\n=== URI PARSE XATOLIGI ===');
      console.log('Sabab: MONGO_URI noto\'g\'ri formatda');
      console.log('\nMumkin bo\'lgan yechimlar:');
      console.log('1. .env fayl ichidagi MONGO_URI ni to\'g\'rilang');
      console.log('2. MongoDB URI formati: mongodb://username:password@host:port/database');
    } else if (err.name === 'MongoNetworkError') {
      console.log('\n=== TARMOQ XATOLIGI ===');
      console.log('Sabab: MongoDB serverga tarmoq orqali ulanib bo\'lmadi');
      console.log('\nMumkin bo\'lgan yechimlar:');
      console.log('1. MongoDB serveri ishlaydimi tekshiring');
      console.log('2. Serverning tarmoq sozlamalarini tekshiring');
      console.log('3. MongoDB serverni qayta ishga tushiring: `sudo service mongod restart`');
    } else if (err.name === 'MongoNotConnectedError') {
      console.log('\n=== ULANISH XATOLIGI ===');
      console.log('Sabab: MongoDB ga ulanishda xatolik');
    }
    
    console.log('\n=== UMUMIY TAVSIYALAR ===');
    console.log('1. MongoDB servicelarini tekshiring: `sudo systemctl status mongodb` yoki `sudo systemctl status mongod`');
    console.log('2. .env fayl ichidagi MONGO_URI to\'g\'riligini tekshiring');
    console.log('3. MongoDB ni qayta ishga tushiring: `sudo systemctl restart mongodb` yoki `sudo systemctl restart mongod`');
    console.log('4. Docker ishlatilayotgan bo\'lsa: `docker ps` bilan container holatini ko\'ring');
    console.log('5. Docker containerini qayta ishga tushirish: `docker restart CONTAINER_ID`');
  })
  .finally(() => {
    console.log('\nDiagnostika tugadi.');
  });
