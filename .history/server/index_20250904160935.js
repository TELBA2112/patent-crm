// Load environment variables from the server folder explicitly
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// Debug mode: fayllarni kuzatish
process.env.NODE_DEBUG = 'module';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true }));
// Statik fayllar: yuklangan fayllar (rasm/PDF)
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Debugging middleware - har bir so'rovni log qilish
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (process.env.DEBUG === 'true' && Object.keys(req.body).length) {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '****';
    console.log('Body:', JSON.stringify(safeBody));
  }
  next();
});

// Load models before routes
try {
  require('./models');
  console.log('Barcha modellar muvaffaqiyatli yuklandi');
} catch (e) {
  console.error('Modellarni yuklashda xatolik:', e.message);
  console.error(e.stack);
  process.exit(1);
}

// Routerlarni ro'yxatdan o'tkazish
const registerRoutes = () => {
  // AUTH
  try {
    console.log('✅ /api/auth routeri ro\'yxatdan o\'tkazilmoqda...');
    const authRouter = require('./routes/auth');
    app.use('/api/auth', authRouter);
    console.log('✅ /api/auth routeri muvaffaqiyatli ro\'yxatdan o\'tkazildi');
  } catch (error) {
    console.error('⛔️ /api/auth routerini yuklashda xatolik:', error.message);
    console.error(error.stack);
  }

  // USERS
  try {
    console.log('✅ /api/users routeri ro\'yxatdan o\'tkazilmoqda...');
    const usersRouter = require('./routes/users');
    app.use('/api/users', usersRouter);
    console.log('✅ /api/users routeri muvaffaqiyatli ro\'yxatdan o\'tkazildi');
  } catch (error) {
    console.error('⛔️ /api/users routerini yuklashda xatolik:', error.message);
    console.error(error.stack);
  }

  // JOBS
  try {
    console.log('✅ /api/jobs routeri ro\'yxatdan o\'tkazilmoqda...');
    const jobsRouter = require('./routes/jobs');
    app.use('/api/jobs', jobsRouter);
    console.log('✅ /api/jobs routeri muvaffaqiyatli ro\'yxatdan o\'tkazildi');
  } catch (error) {
    console.error('⛔️ /api/jobs routerini yuklashda xatolik:', error.message);
    console.error(error.stack);
    const enableFallback = process.env.ENABLE_JOBS_FALLBACK === 'true';
    if (enableFallback) {
      app.use('/api/jobs', (req, res) => {
        res.status(503).json({
          message: 'Jobs router ishga tushmadi',
          hint: 'routes/jobs.js: express Router ni to\'g\'ri export/import qiling va handlerlar async bo\'lsin.'
        });
      });
      console.log('✅ /api/jobs uchun vaqtinchalik 503 fallback endpoint qo\'shildi');
    } else {
      console.log('⚠️ Fallback o\'chirilgan (ENABLE_JOBS_FALLBACK!=true). /api/jobs yo\'li hozircha mavjud emas.');
    }
  }

  // JOB-ACTIONS
  try {
    console.log('✅ /api/job-actions routeri ro\'yxatdan o\'tkazilmoqda...');
    app.use('/api/job-actions', require('./routes/jobActions'));
    console.log('✅ /api/job-actions routeri muvaffaqiyatli ro\'yxatdan o\'tkazildi');
  } catch (error) {
    console.error('⚠️ /api/job-actions routerini yuklashda xatolik:', error.message);
    console.error(error.stack);
    console.log('🔄 /api/job-actions uchun vaqtinchalik endpointlar yaratilmoqda...');
    require('./routes/tempJobActions')(app);
    console.log('✅ Vaqtinchalik job-actions endpointlari yaratildi');
  }

  // NOTIFICATIONS
  try {
    console.log('✅ /api/notifications routeri ro\'yxatdan o\'tkazilmoqda...');
    const notificationsRouter = require('./routes/notifications');
    app.use('/api/notifications', notificationsRouter);
    console.log('✅ /api/notifications routeri muvaffaqiyatli ro\'yxatdan o\'tkazildi');
  } catch (error) {
    console.error('⛔️ /api/notifications routerini yuklashda xatolik:', error.message);
    console.error(error.stack);
  }

  // CHAT
  try {
    console.log('✅ /api/chat routeri ro\'yxatdan o\'tkazilmoqda...');
    app.use('/api/chat', require('./routes/chat'));
    console.log('✅ /api/chat routeri muvaffaqiyatli ro\'yxatdan o\'tkazildi');
  } catch (error) {
    console.error('⛔️ /api/chat routerini yuklashda xatolik:', error.message);
  }

  // NOTIFICATIONS
  try {
    console.log('✅ /api/notifications routeri ro\'yxatdan o\'tkazilmoqda...');
    app.use('/api/notifications', require('./routes/notifications'));
    console.log('✅ /api/notifications routeri muvaffaqiyatli ro\'yxatdan o\'tkazildi');
  } catch (error) {
    console.error('⛔️ /api/notifications routerini yuklashda xatolik:', error.message);
  }
  
  // PAYOUTS & WITHDRAWALS
  try {
    console.log('✅ /api/payouts routeri ro\'yxatdan o\'tkazilmoqda...');
    app.use('/api/payouts', require('./routes/payouts'));
    console.log('✅ /api/payouts routeri muvaffaqiyatli ro\'yxatdan o\'tkazildi');
  } catch (error) {
    console.error('⛔️ /api/payouts routerini yuklashda xatolik:', error.message);
  }
};

registerRoutes();

// Default route
app.get('/', (req, res) => {
  res.send('Patent API Server ishlayapti!');
});

// Debug: list registered routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((m) => {
    if (m.route && m.route.path) {
      routes.push({ method: Object.keys(m.route.methods)[0].toUpperCase(), path: m.route.path });
    } else if (m.name === 'router' && m.handle.stack) {
      m.handle.stack.forEach((h) => {
        if (h.route) {
          const methods = Object.keys(h.route.methods).map(k => k.toUpperCase());
          // Try to include the base path if available
          const base = m.regexp && m.regexp.source ? (m.regexp.source.match(/\^\\\/(.*?)\\\//)?.[1] ? '/' + m.regexp.source.match(/\^\\\/(.*?)\\\//)[1] : '') : '';
          routes.push({ method: methods.join(','), path: base + h.route.path });
        }
      });
    }
  });
  res.json(routes);
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

// Serverni ishga tushirish (dinamik port)
const startServer = async () => {
  try {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/patent-db';
  await mongoose.connect(MONGO_URI);
    console.log('MongoDB ga ulanish muvaffaqiyatli o\'rnatildi');

    const START_PORT = Number(process.env.PORT) || 5000;
    const MAX_TRIES = 10;
    const listenOnPort = (port) => new Promise((resolve, reject) => {
      const server = app.listen(port, () => resolve({ port, server }));
      server.on('error', (err) => reject({ err, port }));
    });

    let selectedPort = null;
    for (let i = 0; i < MAX_TRIES; i++) {
      const port = START_PORT + i;
      try {
        await listenOnPort(port);
        selectedPort = port;
        break;
      } catch (e) {
        const { err, port: attemptedPort } = e;
        if (err && err.code === 'EADDRINUSE') {
          console.warn(`⚠️ ${attemptedPort} port band, ${attemptedPort + 1} port sinab ko'rilmoqda...`);
          continue;
        }
        console.error('Server ishga tushirishda xatolik:', err || e);
        process.exit(1);
      }
    }

    if (!selectedPort) {
      console.error(`\n⛔️ Xatolik: ${START_PORT}..${START_PORT + MAX_TRIES - 1} portlari band.`);
      process.exit(1);
    }

    console.log(`\n✅ Server ${selectedPort} portda ishlayapti`);
    console.log(`📡 API manzili: http://localhost:${selectedPort}\n`);
  } catch (err) {
    console.error('\n⛔️ MongoDB ga ulanishda xatolik:', err.message);
    console.log('\nQuyidagi amallarni tekshiring:');
    console.log('1. MongoDB serveri ishlaypti (local yoki Atlas)');
    console.log('2. .env faylda MONGO_URI to\'g\'ri ko\'rsatilgan');
    console.log('3. Internet ulanishi mavjud (Atlas uchun)\n');
    process.exit(1);
  }
};

startServer();