require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const net = require('net'); // Add this to check port availability
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

// Debug middleware - batafsilroq log
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
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
console.log('✅ /api/auth routeri ro\'yxatdan o\'tkazildi');

app.use('/api/users', usersRouter);
console.log('✅ /api/users routeri ro\'yxatdan o\'tkazildi');

app.use('/api/jobs', jobsRouter);
console.log('✅ /api/jobs routeri ro\'yxatdan o\'tkazildi');

// jobActions routerini tekshirish va to'g'ri ro'yxatdan o'tkazish
app.use('/api/job-actions', jobActionsRouter);
console.log('✅ /api/job-actions routeri ro\'yxatdan o\'tkazildi');

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

// Function to check if a port is available
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => {
        // Port is in use
        resolve(false);
      })
      .once('listening', () => {
        // Port is available
        tester.close();
        resolve(true);
      })
      .listen(port);
  });
};

// Function to find an available port
const findAvailablePort = async (preferredPort, alternativePorts = []) => {
  // First try the preferred port
  if (await isPortAvailable(preferredPort)) {
    return preferredPort;
  }
  
  // If preferred port is not available, try alternatives
  for (const port of alternativePorts) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  
  // If no ports are available, return null
  return null;
};

// Improved server startup
const startServer = async () => {
  try {
    // Try to connect to MongoDB first
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB ga ulanish muvaffaqiyatli o\'rnatildi');
    
    // Get preferred port from env or use 5000 as default
    const preferredPort = parseInt(process.env.PORT || '5000');
    
    // Define alternative ports
    const alternativePorts = [5001, 5002, 5003, 3000, 8080];
    
    // Find an available port
    const availablePort = await findAvailablePort(preferredPort, alternativePorts);
    
    if (!availablePort) {
      console.error(`\n⛔️ Xatolik: Portlar ${[preferredPort, ...alternativePorts].join(', ')} band.`);
      console.log('\nQuyidagi amallarni bajarib ko\'ring:');
      console.log('1. Port holatini tekshirish: sudo lsof -i :5000');
      console.log('2. Jarayonni tugatish: kill -9 <PID>');
      console.log('3. Yoki .env faylda boshqa port belgilash: PORT=8080\n');
      process.exit(1);
    }
    
    // Start server with available port
    app.listen(availablePort, () => {
      console.log(`\n✅ Server ${availablePort} portda ishlayapti`);
      if (availablePort !== preferredPort) {
        console.log(`⚠️  Diqqat: Asosiy port ${preferredPort} band, o'rniga ${availablePort} ishlatilmoqda`);
      }
      console.log(`📡 API manzili: http://localhost:${availablePort}\n`);
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

// Start the server
startServer();
