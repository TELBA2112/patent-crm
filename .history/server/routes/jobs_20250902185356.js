const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Mongoose model (assumes ./models already registered Job)
const Job = mongoose.models.Job || mongoose.model('Job');

// GET /api/jobs
router.get('/', async (req, res, next) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Topilmadi' });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs
router.post('/', async (req, res, next) => {
  try {
    // ...existing code... // agar validatsiya/logika bo‘lsa shu yerga qo‘ying
    const job = await Job.create(req.body);
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

// PUT /api/jobs/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
    const job = await Job.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ message: 'Topilmadi' });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
    const job = await Job.findByIdAndDelete(id);
    if (!job) return res.status(404).json({ message: 'Topilmadi' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
    
    // Operator bo'yicha filtrlash
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    
    // Tekshiruvchi bo'yicha filtrlash
    if (tekshiruvchi) {
      query.tekshiruvchi = tekshiruvchi;
    }
    
    // Yurist bo'yicha filtrlash
    if (yurist) {
      query.yurist = yurist;
    }
    
    // Qidiruv (ism, familiya, brend nomi, telefon)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { clientName: searchRegex },
        { clientSurname: searchRegex },
        { brandName: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    console.log('Final MongoDB query:', JSON.stringify(query));
    
    // Ishlarni olish va populate qilish
    const jobs = await Job.find(query)
      .populate('assignedTo', 'firstName lastName username')
      .populate('tekshiruvchi', 'firstName lastName username')
      .populate('yurist', 'firstName lastName username')
      .sort({ updatedAt: -1 });
    
    console.log(`${jobs.length} ta ish topildi`);
    return res.json(jobs);
  } catch (err) {
    console.error('Ishlarni olishda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// GET /api/jobs/:id — Ishni batafsil olish
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id)
      .populate('assignedTo', 'firstName lastName username')
      .populate('tekshiruvchi', 'firstName lastName username')
      .populate('yurist', 'firstName lastName username');
      
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    
    return res.json(job);
  } catch (err) {
    console.error('Ishni olishda xatolik:', err);
    return res.status(500).json({ message: 'Serverda xatolik', error: err.message });
  }
});

// POST /api/jobs — Yangi ish yaratish
router.post('/', auth, async (req, res) => {
  console.log('\n=== POST /api/jobs SO`ROVI QABUL QILINDI ===');
  console.log('Vaqt:', new Date().toLocaleTimeString());
  console.log('Foydalanuvchi:', req.user.username, '(', req.user.role, ')');
  console.log('So`rov ma`lumotlari:', JSON.stringify(req.body, null, 2));

  try {
    // Majburiy maydonlarni tekshirish
    const { clientName, clientSurname, phone, brandName, personType, assignedTo } = req.body;
    
    const missingFields = [];
    if (!clientName) missingFields.push('clientName');
    if (!clientSurname) missingFields.push('clientSurname');
    if (!phone) missingFields.push('phone');
    if (!assignedTo) missingFields.push('assignedTo');
    if (!personType) missingFields.push('personType');
    
    if (missingFields.length > 0) {
      console.log('XATOLIK: To`ldirilmagan maydonlar:', missingFields.join(', '));
      return res.status(400).json({ 
        message: `Quyidagi maydonlar to'ldirilmagan: ${missingFields.join(', ')}` 
      });
    }

    // Ma'lumotlarni tekshirish
    console.log('Barcha ma`lumotlar to`g`ri. Ish yaratilmoqda...');
    
    const newJob = new Job({
      clientName,
      clientSurname,
      phone,
      brandName: brandName || '',
      personType,
      assignedTo,
      status: 'yangi',
      history: [{
        action: `${req.user.role === 'admin' ? 'Admin' : 'Operator'} tomonidan ish qo'shildi`,
        status: 'yangi',
        updatedBy: req.user.id
      }]
    });

    await newJob.save();
    console.log('MUVAFFAQIYAT: Yangi ish yaratildi. ID:', newJob.jobId);
    
    const populatedJob = await populateJob(Job.findById(newJob._id));
    res.status(201).json(populatedJob);
  } catch (err) {
    console.error('XATOLIK: Ish yaratishda muammo:', err.message);
    console.error(err.stack);
    res.status(500).json({ 
      message: 'Yangi ish yaratishda server xatosi', 
      error: err.message 
    });
  }
});

// PATCH /api/jobs/:id — Ishni tahrirlash
router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params;
  console.log(`\n=== PATCH /api/jobs/${id} SO'ROVI QABUL QILINDI ===`);
  console.log('Vaqt:', new Date().toLocaleTimeString());
  console.log('Foydalanuvchi:', req.user.username, '(', req.user.role, ')');
  console.log('So`rov ma`lumotlari:', JSON.stringify(req.body, null, 2));

  try {
    const job = await Job.findById(id);
    if (!job) {
      console.log('XATOLIK: Ish topilmadi');
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    // O'zgartirish uchun ruxsat tekshirish
    if (req.user.role !== 'admin' && 
        job.assignedTo?.toString() !== req.user.id && 
        job.tekshiruvchi?.toString() !== req.user.id && 
        job.yurist?.toString() !== req.user.id) {
      console.log('XATOLIK: Ruxsat yo`q');
      return res.status(403).json({ message: 'Sizda bu ishni o`zgartirish uchun ruxsat yo`q' });
    }

    const { 
      clientName, 
      clientSurname, 
      phone, 
      brandName, 
      personType, 
      assignedTo, 
      status 
    } = req.body;

    console.log('Ishni yangilash...');
    
    // Ishni yangilash
    if (clientName) job.clientName = clientName;
    if (clientSurname) job.clientSurname = clientSurname;
    if (phone) job.phone = phone;
    if (brandName !== undefined) job.brandName = brandName;
    if (personType) job.personType = personType;
    if (assignedTo) job.assignedTo = assignedTo;
    if (status) job.status = status;

    // Tarix qo'shish
    job.history.push({
      action: `${req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1)} tomonidan ma'lumotlar yangilandi`,
      status: status || job.status,
      updatedBy: req.user.id,
      date: new Date()
    });

    await job.save();
    console.log('MUVAFFAQIYAT: Ish yangilandi');
    
    const updatedJob = await populateJob(Job.findById(id));
    res.json(updatedJob);
  } catch (err) {
    console.error('XATOLIK: Ishni yangilashda muammo:', err.message);
    console.error(err.stack);
    res.status(500).json({ message: 'Serverda xatolik', error: err.message });
  }
});

// DELETE /api/jobs/:id — Ishni o'chirish
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  console.log(`\n=== DELETE /api/jobs/${id} SO'ROVI QABUL QILINDI ===`);
  console.log('Vaqt:', new Date().toLocaleTimeString());
  console.log('Foydalanuvchi:', req.user.username, '(', req.user.role, ')');
  
  try {
    if (req.user.role !== 'admin') {
      console.log('XATOLIK: Faqat admin o`chira oladi');
      return res.status(403).json({ message: 'Faqat admin ishni o`chira oladi' });
    }

    const job = await Job.findByIdAndDelete(id);
    if (!job) {
      console.log('XATOLIK: Ish topilmadi');
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    
    console.log('MUVAFFAQIYAT: Ish o`chirildi');
    res.json({ message: 'Ish muvaffaqiyatli o`chirildi', jobId: id });
  } catch (err) {
    console.error('XATOLIK: Ishni o`chirishda muammo:', err.message);
    console.error(err.stack);
    res.status(500).json({ message: 'Serverda xatolik', error: err.message });
  }
});

// POST /api/jobs/:id/upload-docs - Hujjatlarni saqlash
router.post('/:id/upload-docs', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { personType, yuridikDocs, jismoniyDocs } = req.body;
    
    console.log(`Upload docs so'rovi ${id} ID uchun qabul qilindi`);
    console.log('Shaxs turi:', personType);
    
    if (!personType || (personType !== 'yuridik' && personType !== 'jismoniy')) {
      return res.status(400).json({ message: 'Noto\'g\'ri shaxs turi' });
    }
    
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    
    // Foydalanuvchi ruxsatini tekshirish
    if (req.user.role !== 'admin' && req.user.role !== 'operator') {
      return res.status(403).json({ message: 'Bu ishni tahrirlashga ruxsatingiz yo\'q' });
    }
    
    // Persontype va docs ma'lumotlarini yangilash
    job.personType = personType;
    
    if (personType === 'yuridik') {
      job.yuridikDocs = yuridikDocs;
      console.log('Yuridik hujjatlar saqlandi:', Object.keys(yuridikDocs));
    } else if (personType === 'jismoniy') {
      job.jismoniyDocs = jismoniyDocs;
      console.log('Jismoniy hujjatlar saqlandi:', Object.keys(jismoniyDocs));
    }
    
    // Status o'zgartirish - hujjatlar yuborilganligi sababli
    job.status = 'documents_submitted';
    
    // Tarixga yozib qo'yish
    job.history.push({
      action: 'Hujjatlar tekshiruvchiga yuborildi',
      status: 'documents_submitted',
      updatedBy: req.user.id,
      date: new Date()
    });
    
    await job.save();
    
    console.log(`${id} ID uchun hujjatlar muvaffaqiyatli saqlandi`);
    res.json({
      message: 'Hujjatlar muvaffaqiyatli saqlandi',
      job
    });
  } catch (err) {
    console.error('Hujjatlarni saqlashda xatolik:', err);
    res.status(500).json({ message: 'Server xatoligi', error: err.message });
  }
});

// POST /api/jobs/import-excel - Excel faylidan ishlarni import qilish
router.post('/import-excel', auth, isAdmin, upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Fayl tanlanmagan' });
    }

    console.log('Excel fayli yuklandi:', req.file.path);
    
    // Excel faylni o'qish
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    if (!data || data.length === 0) {
      return res.status(400).json({ message: 'Excel fayli bo\'sh yoki noto\'g\'ri formatda' });
    }
    
    console.log(`Excel faylida ${data.length} ta yozuv topildi`);
    
    // Ma'lumotlarni tekshirish va bazaga saqlash
    const results = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const row of data) {
      try {
        // Majburiy maydonlarni tekshirish
        if (!row.clientName || !row.clientSurname || !row.phone || !row.personType || !row.assignedTo) {
          throw new Error('Majburiy maydonlar: clientName, clientSurname, phone, personType, assignedTo');
        }
        
        // Operatorni ID bo'yicha topish
        const operator = await User.findOne({ username: String(row.assignedTo).trim() });
        if (!operator) {
          throw new Error(`"${row.assignedTo}" nomli operator topilmadi`);
        }
        
        // Yangi ish yaratish
        const newJob = new Job({
          clientName: row.clientName,
          clientSurname: row.clientSurname,
          phone: row.phone,
          brandName: row.brandName || '',
          status: row.status || 'yangi',
          personType: row.personType,
          assignedTo: operator._id,
          history: [{
            action: 'Import qilindi',
            status: row.status || 'yangi',
            updatedBy: req.user.id,
            date: new Date()
          }]
        });
        
        await newJob.save();
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          row: row.clientName + ' ' + row.clientSurname,
          error: err.message
        });
      }
    }
    
    // Faylni o'chirish
    fs.unlinkSync(req.file.path);
    
    res.json({
      message: 'Import jarayoni yakunlandi',
      results
    });
  } catch (err) {
    console.error('Excel import xatoligi:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server xatoligi', error: err.message });
  }
});

// Qo'shimcha endpointlar: MKTU sinflari va ishonchnoma uchun

// MKTU sinflarini saqlash
router.put('/:jobId/mktu-classes', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { classes } = req.body;
    
    if (!Array.isArray(classes)) {
      return res.status(400).json({ message: 'Sinflar massiv formatida bo\'lishi kerak' });
    }
    
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    
    // MKTU sinflarini yangilash
    job.classes = classes;
    await job.save();
    
    console.log(`[MKTU] Job ${jobId} uchun sinflar saqlandi:`, classes);
    return res.status(200).json({ 
      message: 'MKTU sinflari saqlandi', 
      classes: job.classes 
    });
  } catch (err) {
    console.error('MKTU sinflarini saqlashda xatolik:', err);
    return res.status(500).json({ message: 'MKTU sinflarini saqlashda serverda xatolik', error: err.message });
  }
});

// Ishonchnomani saqlash
router.post('/:jobId/power-of-attorney', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { content, personType, classes, format } = req.body;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    
    // Ishonchnomani saqlash
    job.powerOfAttorney = {
      content,
      personType,
      classes,
      format,
      createdAt: new Date()
    };
    
    await job.save();
    
    console.log(`[ISHONCHNOMA] Job ${jobId} uchun ${personType} ishonchnoma saqlandi`);
    return res.status(200).json({
      message: 'Ishonchnoma muvaffaqiyatli saqlandi',
      format: format
    });
  } catch (err) {
    console.error('Ishonchnomani saqlashda xatolik:', err);
    return res.status(500).json({ message: 'Ishonchnomani saqlashda xatolik', error: err.message });
  }
});

// Ishonchnoma PDF formatida olish
router.get('/:jobId/power-of-attorney-pdf', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    
    console.log(`[PDF] Job ${jobId} uchun ishonchnoma PDF so'ralmoqda`);
    
    // HTML matnini tayyorlash
    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Ishonchnoma - ${job.brandName || 'Brend'}</title>
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
            <p><strong>Брэнд номи:</strong> ${job.brandName || 'Кўрсатилмаган'}</p>
            <p><strong>Мижоз:</strong> ${job.clientName} ${job.clientSurname}</p>
            <p><strong>Шахс тури:</strong> ${job.personType === 'yuridik' ? 'Юридик шахс' : 'Жисмоний шахс'}</p>
            <p><strong>MKTU синфлари:</strong> ${(job.classes || []).join(', ')}</p>
            <p><strong>Рўйхатга олиш санаси:</strong> ${job.createdAt ? new Date(job.createdAt).toLocaleDateString('uz-UZ') : '-'}</p>
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
    
    // DOCX formatida qaytarish
    if (req.query.format === 'docx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename="ishonchnoma.docx"');
      
      return res.send(htmlContent);
    }
    
    // PDF formatida qaytarish
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="ishonchnoma.pdf"');
    res.send(htmlContent);
    
    console.log(`[PDF] Job ${jobId} uchun ishonchnoma PDF yuborildi`);
  } catch (err) {
    console.error('PDF yuklashda xatolik:', err);
    return res.status(500).json({ message: 'PDF yuklashda xatolik', error: err.message });
  }
});
module.exports = router;
