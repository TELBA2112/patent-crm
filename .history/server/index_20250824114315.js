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

// So'rovlarni kuzatish middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
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

// ==============================================
// API ENDPOINTLAR
// ==============================================

// Diagnostika endpointlari
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

app.get('/api/debug', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
    mongoConnection: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
    headers: req.headers,
    apiRoutes: [
      '/api/health',
      '/api/auth/login',
      '/api/users',
      '/api/users/me',
      '/api/users-test',
      '/api/jobs',
      '/api/job-actions'
    ]
  });
});

// Test endpointlari (autentifikatsiyasiz)
app.get('/api/test', (req, res) => {
  res.json({ message: 'API ishlayapti!' });
});

app.get('/api/users-test', (req, res) => {
  res.json([
    { id: 'test1', username: 'admin', role: 'admin', firstName: 'Admin', lastName: 'User' },
    { id: 'test2', username: 'operator1', role: 'operator', firstName: 'Operator', lastName: 'First' },
    { id: 'test3', username: 'tekshiruvchi1', role: 'tekshiruvchi', firstName: 'Tekshiruvchi', lastName: 'User' }
  ]);
});

app.post('/api/test-post', (req, res) => {
  console.log('Test POST so\'rovi:', req.body);
  res.status(201).json({ 
    message: 'Test POST so\'rovi qabul qilindi',
    receivedData: req.body,
    id: 'test_' + Date.now() 
  });
});

// Router modullarini import qilish
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const jobsRouter = require('./routes/jobs');
const jobActionsRouter = require('./routes/jobActions');

// Asosiy routerlar ro'yxati
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/job-actions', jobActionsRouter);

// Admin maxsus endpointlari
app.get('/api/admin/stats', require('./middleware/auth').authenticate, require('./middleware/auth').isAdmin, (req, res) => {
  Promise.all([
    mongoose.model('User').countDocuments(),
    mongoose.model('Job').countDocuments(),
    mongoose.model('Job').countDocuments({ status: 'yangi' }),
    mongoose.model('Job').countDocuments({ status: 'bajarildi' })
  ])
  .then(([userCount, jobCount, newJobCount, completedJobCount]) => {
    res.json({
      users: userCount,
      jobs: jobCount,
      newJobs: newJobCount,
      completedJobs: completedJobCount,
      date: new Date()
    });
  })
  .catch(err => {
    console.error('Statistikani olishda xatolik:', err);
    res.status(500).json({ error: 'Statistikani olishda xatolik' });
  });
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
  console.log(`\n=============================================`);
  console.log(`✅ Server ${PORT} portda muvaffaqiyatli ishga tushirildi!`);
  console.log(`✅ Server vaqti: ${new Date().toISOString()}`);
  console.log(`✅ MongoDB ${mongoose.connection.readyState === 1 ? 'ulandi' : 'ulanmadi'}`);
  console.log(`=============================================\n`);
  console.log('Asosiy API endpointlari:');
  console.log('- GET    /api/health        - Server holati');
  console.log('- GET    /api/debug         - Debug ma\'lumotlari');
  console.log('- GET    /api/test          - Test endpointi');
  console.log('- POST   /api/auth/login    - Login');
  console.log('- GET    /api/users         - Foydalanuvchilar ro\'yxati');
  console.log('- GET    /api/users/me      - Joriy foydalanuvchi');
  console.log('- GET    /api/jobs          - Ishlar ro\'yxati');
  console.log('- POST   /api/jobs          - Yangi ish yaratish');
  console.log(`=============================================`);
});

// Serverni ishga tushirish
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server ${PORT} portda ishga tushdi`);
  });

  // O'chirish uchun signalni tinglash
  process.on('SIGINT', () => {
    console.log('O\'chirish signali qabul qilindi, serverni to'xtatish...');
    server.close(err => {
      if (err) {
        console.error('Serverni to\'xtatishda xato:', err);
        process.exit(1);
      }
      console.log('Server muvaffaqiyatli to\'xtatildi');
      process.exit(0);
    });
  });
} else {
  console.log('Modul sifatida import qilindi, server ishga tushirilmadi');
}
