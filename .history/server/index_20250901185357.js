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

  // jobActions routerini himoyalangan tarzda yuklash
  try {
    console.log('✅ /api/job-actions routeri ro\'yxatdan o\'tkazilmoqda...');
    app.use('/api/job-actions', require('./routes/jobActions'));
    console.log('✅ /api/job-actions routeri muvaffaqiyatli ro\'yxatdan o\'tkazildi');
  } catch (error) {
    console.error('⚠️ /api/job-actions routerini yuklashda xatolik:', error.message);
    console.error('⚠️ MKTU sinflarini saqlash va tekshiruvchiga yuborish funksiyasi ishlamaydi.');
    
    // MKTU sinflarini saqlash uchun maxsus endpoint
    app.put('/api/jobs/:jobId/mktu-classes', async (req, res) => {
      try {
        const { jobId } = req.params;
        const { classes } = req.body;
        
        if (!Array.isArray(classes)) {
          return res.status(400).json({ message: 'Sinflar massiv formatida bo\'lishi kerak' });
        }
        
        // MongoDB Job modelini topish
        const Job = mongoose.model('Job');
        const job = await Job.findById(jobId);
        
        if (!job) {
          return res.status(404).json({ message: 'Ish topilmadi' });
        }
        
        // MKTU sinflarini yangilash
        job.classes = classes;
        await job.save();
        
        console.log(`[MKTU] Job ${jobId} uchun sinflar saqlandi:`, classes);
        res.status(200).json({ 
          message: 'MKTU sinflari saqlandi', 
          classes: job.classes 
        });
      } catch (err) {
        console.error('MKTU sinflarini saqlashda xatolik:', err);
        res.status(500).json({ message: 'MKTU sinflarini saqlashda serverda xatolik', error: err.message });
      }
    });
    
    // Brendni tekshiruvchiga yuborish
    app.post('/api/job-actions/:jobId/send-for-review', async (req, res) => {
      try {
        const { jobId } = req.params;
        const { brandName, classes } = req.body;
        
        if (!brandName) {
          return res.status(400).json({ message: 'Brend nomi kiritilmagan' });
        }
        
        // MongoDB Job modelini topish
        const Job = mongoose.model('Job');
        const job = await Job.findById(jobId);
        
        if (!job) {
          return res.status(404).json({ message: 'Ish topilmadi' });
        }
        
        // Brendni va sinflarni saqlash, statusni o'zgartirish
        job.brandName = brandName;
        if (Array.isArray(classes)) {
          job.classes = classes;
        }
        job.status = 'brand_in_review';
        job.updatedAt = new Date();
        
        await job.save();
        
        console.log(`[BREND] Job ${jobId} uchun "${brandName}" brendi tekshiruvga yuborildi`);
        res.status(200).json({ 
          message: 'Brend tekshiruvga yuborildi', 
          brandName: job.brandName,
          classes: job.classes,
          status: job.status
        });
      } catch (err) {
        console.error('Brendni tekshiruvga yuborishda xatolik:', err);
        res.status(500).json({ 
          message: 'Brendni tekshiruvga yuborishda serverda xatolik', 
          error: err.message 
        });
      }
    });
    
    // Hujjatlarni yuborish
    app.post('/api/job-actions/:jobId/submit-documents', async (req, res) => {
      try {
        const { jobId } = req.params;
        const { personType, classes, yuridikDocs, jismoniyDocs } = req.body;
        
        if (!personType) {
          return res.status(400).json({ message: 'Shaxs turi kiritilmagan' });
        }
        
        // MongoDB Job modelini topish
        const Job = mongoose.model('Job');
        const job = await Job.findById(jobId);
        
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
        
        console.log(`[HUJJATLAR] Job ${jobId} uchun ${personType} shaxs hujjatlari yuborildi`);
        res.status(200).json({ 
          message: 'Hujjatlar muvaffaqiyatli yuborildi', 
          personType: job.personType,
          status: job.status
        });
      } catch (err) {
        console.error('Hujjatlarni yuborishda xatolik:', err);
        res.status(500).json({ 
          message: 'Hujjatlarni yuborishda serverda xatolik', 
          error: err.message 
        });
      }
    });
    
    // Power of attorney endpointlari
    app.post('/api/jobs/:jobId/power-of-attorney', (req, res) => {
      try {
        const { jobId } = req.params;
        const { content, personType, classes, format } = req.body;
        
        // Ma'lumotlarni saqlash
        console.log(`[ISHONCHNOMA] Job ${jobId} uchun ${personType} ishonchnoma saqlandi`);
        
        // Bazaga saqlash uchun quyidagi kodni yoqish mumkin
        /*
        const Job = mongoose.model('Job');
        Job.findByIdAndUpdate(jobId, { 
          powerOfAttorney: {
            content, personType, classes, format,
            createdAt: new Date()
          }
        }).exec();
        */
        
        res.status(200).json({ 
          message: 'Ishonchnoma muvaffaqiyatli saqlandi',
          format: format
        });
      } catch (err) {
        console.error('Ishonchnomani saqlashda xatolik:', err);
        res.status(500).json({ message: 'Ishonchnomani saqlashda xatolik', error: err.message });
      }
    });
    
    app.get('/api/jobs/:jobId/power-of-attorney-pdf', (req, res) => {
      try {
        const { jobId } = req.params;
        console.log(`[PDF] Job ${jobId} uchun ishonchnoma PDF so'ralmoqda`);
        
        // HTML matnini tayyorlash
        const htmlContent = `
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Ishonchnoma</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { text-align: center; text-transform: uppercase; }
                .content { line-height: 1.6; }
                .signature { margin-top: 50px; }
                .header { border-bottom: 1px solid #ccc; padding-bottom: 10px; }
                .footer { border-top: 1px solid #ccc; margin-top: 30px; padding-top: 10px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Ишончнома</h1>
                <p>Сана: ${new Date().toLocaleDateString('uz-UZ')}</p>
              </div>
              <div class="content">
                <p>Бу ишончнома вақтинчалик фойдаланиш учун яратилган намуна ҳисобланади.</p>
                <p>Job ID: ${jobId}</p>
                <p>Бу ҳужжат товар белгисини рўйхатдан ўтказиш жараёнида фойдаланиш учун тузилди.</p>
                <p>Ишончнома 2025 йил 31-декабргача амал қилади.</p>
              </div>
              <div class="signature">
                <p>Имзо: ________________</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} - Patent System</p>
              </div>
            </body>
          </html>
        `;
        
        // HTML ko'rinishida qaytarish
        if (req.query.format === 'html') {
          res.setHeader('Content-Type', 'text/html');
          return res.send(htmlContent);
        }
        
        // DOCX formatida qaytarish - maslahat uchun
        if (req.query.format === 'docx') {
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          res.setHeader('Content-Disposition', 'attachment; filename="ishonchnoma.docx"');
          
          // Bu yerda oddiy HTML matnini qaytaramiz (frontendda Word formatiga aylantiriladi)
          return res.send(htmlContent);
        }
        
        // PDF formatida qaytarish
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="ishonchnoma.pdf"');
        
        // HTML string sifatida yuborish - frontend PDF ga aylantiradi
        // Haqiqiy serverda HTML to PDF konvertatsiya kerak
        res.send(htmlContent);
        
        console.log(`[PDF] Job ${jobId} uchun ishonchnoma PDF yuborildi`);
      } catch (err) {
        console.error('PDF yuklashda xatolik:', err);
        res.status(500).json({ message: 'PDF yuklashda xatolik', error: err.message });
      }
    });
    
    app.get('/api/power-of-attorney/:jobId', async (req, res) => {
      try {
        const { jobId } = req.params;
        
        // MongoDB Job modelini topish
        const Job = mongoose.model('Job');
        const job = await Job.findById(jobId);
        
        if (!job) {
          return res.status(404).json({ message: 'Ish topilmadi' });
        }
        
        // Ishonchnoma ma'lumotlarini qaytarish
        const mockData = {
          jshshr: '31234567890123',  // Taxminiy JSHSHR
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
        };
        
        res.status(200).json(mockData);
      } catch (err) {
        console.error('Ishonchnoma ma\'lumotlarini olishda xatolik:', err);
        res.status(500).json({ 
          message: 'Ishonchnoma ma\'lumotlarini olishda xatolik', 
          error: err.message 
        });
      }
    });
    
    console.log('✅ Vaqtinchalik job-actions endpointlari muvaffaqiyatli yaratildi');
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



// Serverni ishga tushirish
startServer();