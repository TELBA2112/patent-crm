const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Job = require('../models/Job');

// Save power of attorney
router.post('/:id/power-of-attorney', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Save power of attorney data
    job.powerOfAttorney = {
      content: req.body.content,
      personType: req.body.personType,
      createdAt: new Date(),
      createdBy: req.user.id
    };
    
    // Update classes if provided
    if (req.body.classes && Array.isArray(req.body.classes)) {
      job.classes = req.body.classes;
    }
    
    // Add to history
    job.history.push({
      status: 'power_of_attorney_created',
      date: new Date(),
      userId: req.user.id
    });
    
    await job.save();
    
    res.json({ success: true, message: 'Power of attorney saved successfully' });
  } catch (err) {
    console.error('Error saving power of attorney:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get MKTU classes for a job
router.get('/:id/mktu-classes', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Return the MKTU classes
    res.json({ classes: job.classes || [] });
  } catch (err) {
    console.error('Error getting MKTU classes:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update MKTU classes for a job
router.post('/:id/mktu-classes', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Update the MKTU classes
    if (req.body.classes && Array.isArray(req.body.classes)) {
      job.classes = req.body.classes;
      
      // Add to history
      job.history.push({
        status: 'mktu_classes_updated',
        date: new Date(),
        userId: req.user.id
      });
      
      await job.save();
      
      return res.json({ 
        success: true, 
        message: 'MKTU classes updated successfully',
        classes: job.classes
      });
    } else {
      return res.status(400).json({ message: 'Invalid classes data' });
    }
  } catch (err) {
    console.error('Error updating MKTU classes:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
// GET /api/jobs/export - Excelga eksport qilish
router.get('/export', authenticate, async (req, res) => {
  try {
    const jobs = await Job.find(req.query).populate('assignedTo', 'username');
    const data = jobs.map(job => ({
      'ID': job.jobId,
      'Mijoz Ismi': job.clientName,
      'Mijoz Familiyasi': job.clientSurname,
      'Telefon': job.phone,
      'Brend Nomi': job.brandName,
      'Status': job.status,
      'Operator': job.assignedTo ? job.assignedTo.username : 'N/A',
      'Shaxs Turi': job.personType,
      'Yaratilgan Sana': job.createdAt.toLocaleDateString(),
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Jobs');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.header('Content-Disposition', 'attachment; filename="jobs_export.xlsx"');
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: 'Excel eksport qilishda xatolik', error: err.message });
  }
});

// POST /api/jobs/import-excel - Exceldan import qilish
router.post('/import-excel', authenticate, isAdmin, upload.single('excelFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Excel fayli topilmadi' });
  }
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const [index, row] of data.entries()) {
      try {
        if (!row.clientName || !row.clientSurname || !row.phone || !row.personType || !row.assignedTo) {
          throw new Error('Majburiy maydonlar to\'ldirilmagan: clientName, clientSurname, phone, personType, assignedTo');
        }
        const operator = await User.findOne({ username: row.assignedTo, role: 'operator' });
        if (!operator) {
          throw new Error(`Operator "${row.assignedTo}" topilmadi`);
        }
        const newJob = new Job({
          clientName: row.clientName,
          clientSurname: row.clientSurname,
          phone: row.phone,
          brandName: row.brandName,
          personType: row.personType,
          status: row.status || 'yangi',
          assignedTo: operator._id,
          createdBy: req.user.id,
        });
        await newJob.save();
        successCount++;
      } catch (err) {
        failedCount++;
        errors.push({ row: index + 2, error: err.message });
      }
    }
    res.json({
      message: 'Import yakunlandi',
      results: { total: data.length, success: successCount, failed: failedCount, errors },
    });
  } catch (err) {
    res.status(500).json({ message: 'Excel import qilishda xatolik', error: err.message });
  }
});

module.exports = router;
        errors,

// PATCH /api/jobs/:id — Ishni tahrirlash
router.patch('/:id', authenticate, async (req, res) => {
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
router.delete('/:id', authenticate, async (req, res) => {
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
router.post('/:id/upload-docs', authenticate, async (req, res) => {
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
router.post('/import-excel', authenticate, isAdmin, upload.single('excelFile'), async (req, res) => {
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

module.exports = router;
