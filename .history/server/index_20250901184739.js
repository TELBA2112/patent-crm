require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const net = require('net'); // <-- Added this line
const app = express();

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

// Faqat bir marta router ro'yxatga olish uchun
const registerRoutes = () => {
  console.log('✅ /api/auth routeri ro\'yxatdan o\'tkazildi');
  app.use('/api/auth', require('./routes/auth'));

  console.log('✅ /api/users routeri ro\'yxatdan o\'tkazildi');
  app.use('/api/users', require('./routes/users'));

  console.log('✅ /api/jobs routeri ro\'yxatdan o\'tkazildi');
  app.use('/api/jobs', require('./routes/jobs'));

  // jobActions routerini vaqtincha o'chirib qo'yamiz
  // console.log('✅ /api/job-actions routeri ro\'yxatdan o\'tkazildi');
  // app.use('/api/job-actions', require('./routes/jobActions'));
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

startServer();  }
};

// Serverni ishga tushirish
startServer();