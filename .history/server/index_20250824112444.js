require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// CORS sozlamalari
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// So'rovlarni qayta ishlash
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// So'rovlarni kuzatish middleware - batafsil loglar
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Uploads papkasini yaratish
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
const certificatesDir = path.join(uploadsDir, 'certificates');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Uploads papkasi yaratildi');
}

if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir);
  console.log('Certificates papkasi yaratildi');
}

// MongoDB ulanish
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/patent-db')
  .then(() => {
    console.log('MongoDB ulandi');
    console.log('MongoDB URL:', process.env.MONGO_URI || 'mongodb://localhost:27017/patent-db');
  })
  .catch(err => console.error('MongoDB ulanish xatosi:', err));

// Diagnostika endpointi
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    }
  });
});

// Router modullarini import qilish
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const jobsRouter = require('./routes/jobs');

// Routerlar registratsiyasi
console.log('API routerlar ro\'yxatdan o\'tkazilmoqda...');

// Auth router
app.use('/api/auth', authRouter);
console.log('✅ /api/auth ro\'yxatdan o\'tkazildi');

// Users router - qo'shimcha tekshirish bilan
try {
  if (!usersRouter || typeof usersRouter !== 'function') {
    console.error('⚠️ Users router noto\'g\'ri formatda:', usersRouter);
  }
  app.use('/api/users', usersRouter);
  console.log('✅ /api/users ro\'yxatdan o\'tkazildi');
} catch (err) {
  console.error('❌ /api/users ro\'yxatdan o\'tkazishda xatolik:', err);
}

// Jobs router
app.use('/api/jobs', jobsRouter);
console.log('✅ /api/jobs ro\'yxatdan o\'tkazildi');

// Test endpointlari
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint ishlayapti' });
});

app.get('/api/users-test', (req, res) => {
  res.json([
    { _id: 'test1', username: 'admin', role: 'admin', firstName: 'Admin', lastName: 'User' },
    { _id: 'test2', username: 'operator', role: 'operator', firstName: 'Test', lastName: 'Operator' }
  ]);
});

// Statik fayllar
app.use('/uploads', express.static('uploads'));

// 404 xatoligi
app.use((req, res) => {
  console.log(`404 xatoligi: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Manba topilmadi', path: req.url, method: req.method });
});

// Xatolarni qayta ishlash
app.use((err, req, res, next) => {
  console.error('Server xatoligi:', err);
  res.status(500).json({ message: 'Serverda ichki xatolik', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portda ishlayapti`);
  console.log(`Server vaqti: ${new Date().toISOString()}`);
  console.log('API endpointlari:');
  console.log('- GET    /api/health');
  console.log('- GET    /api/test');
  console.log('- GET    /api/users-test');
  console.log('- GET    /api/users');
  console.log('- POST   /api/users');
  console.log('- GET    /api/jobs');
  console.log('- POST   /api/jobs');
});
