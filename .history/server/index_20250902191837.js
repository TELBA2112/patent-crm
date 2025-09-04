require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const net = require('net'); // <-- Added this line
const app = express();

// Debug mode: fayllarni kuzatish
process.env.NODE_DEBUG = 'module';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true }));

// Debugging middleware - har bir so'rovni log qilish
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  // Faqat headers va bodyni debug rejimda ko'rsatish
  if (process.env.DEBUG === 'true') {
    if (Object.keys(req.body).length) {
      // Parolni maskirovka qilib ko'rsatish
      const safeBody = {...req.body};
      if (safeBody.password) safeBody.password = '****';
      console.log('Body:', JSON.stringify(safeBody));
    }
  }
  next();
});

// Load models before routes
try {
  require('./models');
  console.log('Barcha modellar muvaffaqiyatli yuklandi');
  try {
    // Try to connect to MongoDB first
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB ga ulanish muvaffaqiyatli o\'rnatildi');

    // Try to listen on 5000, if busy, fall back to next available up to +10
    const START_PORT = 5000;
    const MAX_TRIES = 10;

    const listenOnPort = (port) => new Promise((resolve, reject) => {
      const server = app.listen(port, () => resolve({ port, server }));
      server.on('error', (err) => reject({ err, port }));
    });

    let selectedPort = null;
    for (let i = 0; i < MAX_TRIES; i++) {
      const port = START_PORT + i;
      try {
        const { port: boundPort } = await listenOnPort(port);
        selectedPort = boundPort;
        break;
      } catch (e) {
        const { err, port: attemptedPort } = e;
        if (err.code === 'EADDRINUSE') {
          console.warn(`\u26a0\ufe0f ${attemptedPort} port band, ${attemptedPort + 1} port sinab ko'rilmoqda...`);
          continue;
        }
        console.error('Server ishga tushirishda xatolik:', err || e);
        process.exit(1);
      }
    }

    if (!selectedPort) {
      console.error(`\n\u26d4\ufe0f Xatolik: ${START_PORT}..${START_PORT + MAX_TRIES - 1} portlari band.`);
      process.exit(1);
    }

    console.log(`\n\u2705 Server ${selectedPort} portda ishlayapti`);
    console.log(`\ud83d\udce1 API manzili: http://localhost:${selectedPort}\n`);
  } catch (err) {
  // JOBS
  try {
    console.log('✅ /api/jobs routeri ro\'yxatdan o\'tkazilmoqda...');
    const jobsRouter = require('./routes/jobs');
    app.use('/api/jobs', jobsRouter);
    console.log('✅ /api/jobs routeri muvaffaqiyatli ro\'yxatdan o\'tkazildi');
  } catch (error) {
    console.error('⛔️ /api/jobs routerini yuklashda xatolik:', error.message);
    console.error(error.stack);
    // Vaqtinchalik 503 javob beradigan fallback, server yiqilmasligi uchun
    app.use('/api/jobs', (req, res) => {
      res.status(503).json({
        message: 'Jobs router ishga tushmadi',
        hint: 'routes/jobs.js (taxminan 53-qator): router.get(..., handler) ga funksiya bering. Masalan: router.get("/", jobsController.getAll) va controller funksiyalarini to‘g‘ri export qiling.'
      });
    });
    console.log('✅ /api/jobs uchun vaqtinchalik 503 fallback endpoint qo\'shildi');
  }

  // JOB-ACTIONS (mavjud try/catch saqlanadi)
  try {
    console.log('✅ /api/job-actions routeri ro\'yxatdan o\'tkazilmoqda...');
    app.use('/api/job-actions', require('./routes/jobActions'));
    console.log('✅ /api/job-actions routeri muvaffaqiyatli ro\'yxatdan o\'tkazildi');
  } catch (error) {
    console.error('⚠️ /api/job-actions routerini yuklashda xatolik:', error.message);
    console.error(error.stack);
    
    // Vaqtinchalik endpointlar o'rniga ishlaydigan muqobil yondashuv:
    console.log('🔄 /api/job-actions uchun vaqtinchalik endpointlar yaratilmoqda...');
    require('./routes/tempJobActions')(app);
    console.log('✅ Vaqtinchalik job-actions endpointlari yaratildi');
  }
};

// Routerlarni bir marta ro'yxatga olish
registerRoutes();

// Default route
app.get('/', (req, res) => {
  res.send('Patent API Server ishlayapti!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('SERVER XATOSI:', err.stack);
  res.status(500).json({ message: 'Server xatosi', error: err.message });
});

// 404 xatoligi
app.use((req, res) => {
  console.log(`404 xatoligi: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Manba topilmadi', path: req.url, method: req.method });
});

// Modified server startup function to always use port 5000
const startServer = async () => {
  try {
    // Try to connect to MongoDB first
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB ga ulanish muvaffaqiyatli o\'rnatildi');
    
    // Fixed port - always use 5000
    const PORT = 5000;
    
    // Start server
    app.listen(PORT, () => {
      console.log(`\n✅ Server ${PORT} portda ishlayapti`);
      console.log(`📡 API manzili: http://localhost:${PORT}\n`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n⛔️ Xatolik: ${PORT} port allaqon band.`);
        console.log('\nPortni bo\'shatish uchun quyidagi amallarni bajarib ko\'ring:');
        console.log('1. Quyidagi buyruq bilan 5000 portda ishlaydigan jarayonlarni ko\'ring:');
        console.log('   sudo lsof -i :5000');
        console.log('2. Jarayonni tugatish (PID - jarayon ID raqami):');
        console.log('   kill -9 <PID>');
        console.log('\nAgar Docker ishlatilayotgan bo\'lsa:');
        console.log('1. docker ps - ishlab turgan konteynerlarni ko\'rish');
        console.log('2. docker stop <CONTAINER_ID> - portni band qilgan konteynerni to\'xtatish\n');
        process.exit(1);
      } else {
        console.error('Server ishga tushirishda xatolik:', err);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('\n⛔️ MongoDB ga ulanishda xatolik:', err.message);
    console.log('\nQuyidagi amallarni tekshiring:');
    console.log('1. MongoDB serveri ishlaypti (local yoki Atlas)');
    console.log('2. .env faylda MONGO_URI to\'g\'ri ko\'rsatilgan');
    console.log('3. Internet ulanishi mavjud (Atlas uchun)\n');
    process.exit(1);
  }
};

// Serverni ishga tushirish
startServer();