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
} catch (e) {
  console.error('Modellarni yuklashda xatolik:', e.message);
  console.error(e.stack);
  process.exit(1);
}

// Faqat bir marta router ro'yxatga olish uchun
const registerRoutes = () => {
  console.log('✅ /api/auth routeri ro\'yxatdan o\'tkazildi');
  app.use('/api/auth', require('./routes/auth'));

  console.log('✅ /api/users routeri ro\'yxatdan o\'tkazildi');
  app.use('/api/users', require('./routes/users'));

  try {
    console.log('✅ /api/jobs routeri ro\'yxatdan o\'tkazildi');
    app.use('/api/jobs', require('./routes/jobs'));
  } catch (error) {
    console.error('⚠️ Jobs router xatoligi:', error);
  }

  // MUHIM: Vaqtinchalik to'g'ridan-to'g'ri endpointlar yaratish
  console.log('✅ Muhim API endpointlar to\'g\'ridan-to\'g'ri yaratilmoqda...');
  
  const auth = require('./middleware/auth');
  
  // Brendni tekshiruvchiga yuborish
  app.post('/api/job-actions/:jobId/send-for-review', auth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const { brandName, classes } = req.body;
      
      if (!brandName) {
        return res.status(400).json({ message: 'Brend nomi kiritilmagan' });
      }
      
      const job = await mongoose.model('Job').findById(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Ish topilmadi' });
      }
      
      // Brendni va sinflarni saqlash
      job.brandName = brandName;
      if (Array.isArray(classes)) {
        job.classes = classes;
      }
      job.status = 'brand_in_review';
      job.updatedAt = new Date();
      
      await job.save();
      
      console.log(`[BREND] Job ${jobId} uchun "${brandName}" brendi tekshiruvga yuborildi`);
      return res.status(200).json({ 
        message: 'Brend tekshiruvga yuborildi', 
        brandName: job.brandName,
        classes: job.classes,
        status: job.status
      });
    } catch (err) {
      console.error('Brendni tekshiruvga yuborishda xatolik:', err);
      return res.status(500).json({ 
        message: 'Brendni tekshiruvga yuborishda serverda xatolik', 
        error: err.message 
      });
    }
  });
  
  // Tekshiruvchi uchun brend tekshirish natijasini saqlash
  app.post('/api/job-actions/:jobId/review-brand', auth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const { approved, reason } = req.body;
      
      const job = await mongoose.model('Job').findById(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Ish topilmadi' });
      }
      
      if (approved === true) {
        job.status = 'approved';
        job.reviewResult = { approved: true, date: new Date() };
      } else {
        job.status = 'returned_to_operator';
        job.reviewResult = { 
          approved: false, 
          reason: reason || 'Sabab ko\'rsatilmagan', 
          date: new Date() 
        };
      }
      
      job.updatedAt = new Date();
      await job.save();
      
      return res.status(200).json({ 
        message: approved ? 'Brend tasdiqlandi' : 'Brend rad etildi', 
        status: job.status
      });
    } catch (err) {
      console.error('Brend tekshiruvida xatolik:', err);
      return res.status(500).json({ message: 'Server xatosi', error: err.message });
    }
  });
  
  // Hujjatlarni yuborish
  app.post('/api/job-actions/:jobId/submit-documents', auth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const { personType, classes, yuridikDocs, jismoniyDocs } = req.body;
      
      if (!personType) {
        return res.status(400).json({ message: 'Shaxs turi kiritilmagan' });
      }
      
      const job = await mongoose.model('Job').findById(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Ish topilmadi' });
      }
      
      // Ma'lumotlarni saqlash
      job.personType = personType;
      
      if (Array.isArray(classes)) {
        job.classes = classes;
      }
      
      if (personType === 'yuridik' && yuridikDocs) {
        job.yuridikDocs = yuridikDocs;
      } else if (personType === 'jismoniy' && jismoniyDocs) {
        job.jismoniyDocs = jismoniyDocs;
      }
      
      job.status = 'documents_submitted';
      job.updatedAt = new Date();
      
      await job.save();
      
      return res.status(200).json({ 
        message: 'Hujjatlar muvaffaqiyatli yuborildi', 
        personType: job.personType,
        status: job.status
      });
    } catch (err) {
      console.error('Hujjatlarni yuborishda xatolik:', err);
      return res.status(500).json({ message: 'Server xatoligi', error: err.message });
    }
  });
  
  // Ishonchnoma uchun ma'lumotlar
  app.get('/api/job-actions/:jobId/power-of-attorney', auth, async (req, res) => {
    try {
      const { jobId } = req.params;
      
      const job = await mongoose.model('Job').findById(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Ish topilmadi' });
      }
      
      return res.status(200).json({
        jshshr: '31234567890123',
        clientInfo: {
          name: job.clientName || '',
          surname: job.clientSurname || '',
          phone: job.phone || '',
        },
        companyInfo: job.yuridikDocs || {},
        personInfo: job.jismoniyDocs || {},
        brandName: job.brandName || '',
        classes: job.classes || [],
        createdAt: new Date()
      });
    } catch (err) {
      console.error('Ishonchnoma ma\'lumotlarini olishda xatolik:', err);
      return res.status(500).json({ message: 'Server xatoligi', error: err.message });
    }
  });
  
  console.log('✅ Barcha muhim API endpointlar muvaffaqiyatli yaratildi');
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