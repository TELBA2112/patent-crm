require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
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

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');
const jobActionsRoutes = require('./routes/jobActions'); // Check this path is correct

// Faqat bir marta router ro'yxatga olish uchun
const registerRoutes = () => {
  console.log('✅ /api/auth routeri ro\'yxatdan o\'tkazildi');
  app.use('/api/auth', authRoutes);

  console.log('✅ /api/users routeri ro\'yxatdan o\'tkazildi');
  app.use('/api/users', userRoutes);

  console.log('✅ /api/jobs routeri ro\'yxatdan o\'tkazildi');
  app.use('/api/jobs', jobRoutes);

  console.log('✅ /api/job-actions routeri ro\'yxatdan o\'tkazildi');
  app.use('/api/job-actions', jobActionsRoutes); // Check this is correctly registered
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

// Portni tekshirish va ishlatilayotgan jarayonni tugatish
const checkAndFreePorts = async (port) => {
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    console.log(`\n🔍 Port ${port} holatini tekshirish...`);
    
    // Portni tekshirish
    const { stdout } = await execPromise(`lsof -i :${port} -t`);
    
    if (stdout.trim()) {
      const pids = stdout.trim().split('\n');
      console.log(`⚠️ Port ${port} quyidagi jarayonlar tomonidan ishlatilmoqda: ${pids.join(', ')}`);
      
      if (pids.length === 1) {
        // Faqat bitta jarayon bo'lsa, uni to'xtatish haqida so'rash
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        return new Promise((resolve) => {
          readline.question(`❓ Jarayonni to'xtatib, serverni ishga tushirishni istaysizmi? (y/n) `, async (answer) => {
            readline.close();
            
            if (answer.toLowerCase() === 'y') {
              console.log(`🔄 Jarayon ${pids[0]} to'xtatilmoqda...`);
              await execPromise(`kill -9 ${pids[0]}`);
              console.log(`✅ Jarayon to'xtatildi. Port ${port} bo'shatildi.`);
              resolve(true);
            } else {
              console.log('❌ Jarayon to\'xtatilmadi. Server ishga tushmaydi.');
              resolve(false);
            }
          });
        });
      } else {
        console.log('\n🔄 Jarayonni to\'xtatish uchun quyidagi buyruqni ishga tushiring:');
        console.log(`sudo kill -9 ${pids.join(' ')}`);
        return false;
      }
    } else {
      console.log(`✅ Port ${port} bo'sh va ishlatish uchun tayyor.`);
      return true;
    }
  } catch (error) {
    // lsof buyrug'i mavjud bo'lmasa yoki boshqa xatolik
    console.log(`⚠️ Portni tekshirishda xatolik: ${error.message}`);
    console.log('Port bandligini tekshirib bo\'lmadi. Davom etish...');
    return true; // Davom etishga ruxsat berish
  }
};

// Serverni ishga tushirish
// (Removed duplicate startServer function)

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