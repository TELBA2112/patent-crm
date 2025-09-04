/**
 * Bu skript jobNo indeksini o'chirish va ma'lumotlar bazasini tuzatish uchun
 * Ishga tushirish: node fix-jobno-issue.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixJobNoIssue() {
  try {
    console.log('MongoDB ga ulanish...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/patent-db');
    console.log('MongoDB ga ulandi');

    // jobs kolleksiyasini olish
    const db = mongoose.connection.db;
    const jobs = db.collection('jobs');
    
    console.log('jobs kolleksiyasi indekslarini olish...');
    const indexes = await jobs.indexes();
    console.log('Mavjud indekslar:', indexes);
    
    // jobNo indeksini topish
    const jobNoIndex = indexes.find(index => 
      index.name === 'jobNo_1' || 
      (index.key && index.key.jobNo)
    );
    
    if (jobNoIndex) {
      console.log('jobNo indeksini o\'chirish...');
      await jobs.dropIndex(jobNoIndex.name);
      console.log('jobNo indeksi muvaffaqiyatli o\'chirildi');
    } else {
      console.log('jobNo indeksi topilmadi');
    }
    
    // jobId indeksini yaratish/tekshirish
    const jobIdIndex = indexes.find(index => 
      index.name === 'jobId_1' || 
      (index.key && index.key.jobId)
    );
    
    if (!jobIdIndex) {
      console.log('jobId indeksini yaratish...');
      await jobs.createIndex({ jobId: 1 }, { unique: true, sparse: true });
      console.log('jobId indeksi muvaffaqiyatli yaratildi');
    } else {
      console.log('jobId indeksi allaqachon mavjud');
    }
    
    // Job modelini qayta yuklash
    delete mongoose.models.Job;
    require('./models/Job');
    
    console.log('Tuzatish muvaffaqiyatli yakunlandi');
  } catch (err) {
    console.error('Xatolik:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB dan uzildi');
  }
}

fixJobNoIssue().catch(console.error);
