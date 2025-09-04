const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Job = require('../models/Job');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// GET /api/job-actions/stats - Ishlar bo'yicha statistika
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = {
      total: await Job.countDocuments(),
      yangi: await Job.countDocuments({ status: 'yangi' }),
      bajarilmoqda: await Job.countDocuments({ status: 'bajarilmoqda' }),
      bajarildi: await Job.countDocuments({ status: 'bajarildi' }),
      brand_in_review: await Job.countDocuments({ status: 'brand_in_review' }),
      operators: await User.countDocuments({ role: 'operator' }),
      tekshiruvchilar: await User.countDocuments({ role: 'tekshiruvchi' }),
      yuristlar: await User.countDocuments({ role: 'yurist' })
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Statistikani olishda xatolik:', err);
    res.status(500).json({ message: 'Serverda xatolik', error: err.message });
  }
});

// POST /api/job-actions/:id/send-for-review — Brendni tekshiruvchiga yuborish
router.post('/:id/send-for-review', authenticate, async (req, res) => {
  const { id } = req.params;
  const { brandName } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  console.log('Brend tekshiruvga yuborish so\'rovi:', { id, brandName, userId, role });

  try {
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    if (role !== 'operator' && role !== 'admin') {
      return res.status(403).json({ message: 'Sizda brend yuborish uchun ruxsat yo\'q' });
    }

    if (role === 'operator' && job.assignedTo?.toString() !== userId) {
      return res.status(403).json({ message: 'Sizda bu ishni yuborish uchun ruxsat yo\'q' });
    }

    if (!brandName) {
      return res.status(400).json({ message: 'Brend nomi kiritilishi shart' });
    }

    const tekshiruvchi = await User.findOne({ role: 'tekshiruvchi' });
    if (!tekshiruvchi) {
      return res.status(400).json({ message: 'Tekshiruvchi topilmadi' });
    }

    job.brandName = brandName;
    job.status = 'brand_in_review';
    job.tekshiruvchi = tekshiruvchi._id;
    job.history.push({
      action: 'Brend tekshiruvchiga yuborildi',
      status: 'brand_in_review',
      updatedBy: userId,
      date: new Date()
    });

    await job.save();
    res.json({ message: 'Brend tekshiruvchiga yuborildi', job });
  } catch (err) {
    console.error('Brend yuborishda xatolik:', err);
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
});

// POST /api/job-actions/:id/review-brand — Tekshiruvchi tomonidan brend ko'rilishi
router.post('/:id/review-brand', authenticate, async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const userId = req.user.id;

  console.log('\n=== BRAND REVIEW REQUEST ===');
  console.log('Job ID:', id);
  console.log('Status:', status);
  console.log('Reason:', reason);
  console.log('User ID:', userId);

  try {
    if (req.user.role !== 'tekshiruvchi' && req.user.role !== 'admin') {
      console.log('❌ XATOLIK: Foydalanuvchi roli tekshiruvchi yoki admin emas:', req.user.role);
      return res.status(403).json({ message: 'Faqat tekshiruvchilar brend ko\'rishi mumkin' });
    }

    const job = await Job.findById(id);
    if (!job) {
      console.log('❌ XATOLIK: Ish topilmadi ID:', id);
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    // Faqat brand_in_review holatidagi ishlarni ko'rish mumkin
    if (job.status !== 'brand_in_review') {
      console.log('❌ XATOLIK: Ish tekshirish holatida emas:', job.status);
      return res.status(400).json({ message: 'Bu ish tekshirish uchun tayyor emas' });
    }

    // Admin uchun tekshirish shartini o'zgartirish
    if (req.user.role !== 'admin' && job.tekshiruvchi?.toString() !== userId) {
      console.log('❌ XATOLIK: Ruxsat yo\'q. Tekshiruvchi ID:', job.tekshiruvchi, 'User ID:', userId);
      return res.status(403).json({ message: 'Bu ishni ko\'rishga ruxsatingiz yo\'q' });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      console.log('❌ XATOLIK: Noto\'g\'ri status:', status);
      return res.status(400).json({ message: 'Status noto\'g\'ri: approved yoki rejected bo\'lishi kerak' });
    }

    if (status === 'rejected' && !reason) {
      console.log('❌ XATOLIK: Rad etish sababi ko\'rsatilmagan');
      return res.status(400).json({ message: 'Rad etish sababini ko\'rsatish shart' });
    }

    console.log('✅ Barcha tekshirishlar o\'tdi, ish yangilanmoqda...');
    
    // Tekshiruvdan o'tgan ishni tegishli statusga o'tkazish
    const newStatus = status === 'approved' ? 'documents_pending' : 'returned_to_operator';
    
    job.status = newStatus;
    job.comments = reason || '';
    job.history.push({
      action: `Brend ${status === 'approved' ? 'tasdiqlandi' : 'rad etildi'}`,
      status: newStatus,
      reason: reason || '',
      updatedBy: userId,
      date: new Date()
    });

    await job.save();
    console.log('✅ Ish muvaffaqiyatli yangilandi');
    console.log('✅ Yangi status:', newStatus);
    
    res.json({ 
      message: `Brend ${status === 'approved' ? 'tasdiqlandi' : 'rad etildi'}`, 
      job 
    });
  } catch (err) {
    console.error('❌ SERVER XATOLIGI:', err);
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
});

// POST /api/job-actions/:id/send-to-lawyer - Ishni yuristga yuborish
router.post('/:id/send-to-lawyer', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    
    // Faqat tekshiruvchi/admin yuborishga ruxsati bor
    if (req.user.role !== 'tekshiruvchi' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Sizda yuristga yuborish huquqi yo\'q' });
    }
    
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    
    // Faqat documents_submitted statusidagi ishlarni yuborish mumkin
    if (job.status !== 'documents_submitted') {
      return res.status(400).json({ 
        message: 'Bu ish hujjatlar yuborilgan holatda emas',
        expectedStatus: 'documents_submitted',
        actualStatus: job.status
      });
    }
    
    // Yuristni topish
    const yurist = await User.findOne({ role: 'yurist' });
    if (!yurist) {
      return res.status(400).json({ message: 'Yurist topilmadi, avval yurist yarating' });
    }
    
    // Status o'zgartirish va yuristni belgilash
    job.status = 'to_lawyer';
    job.yurist = yurist._id;
    job.comments = comment || 'Hujjatlar tekshirildi va yuristga yuborildi';
    
    // Tarixga yozib qo'yish
    job.history.push({
      action: 'Hujjatlar tasdiqlandi va yuristga yuborildi',
      status: 'to_lawyer',
      updatedBy: userId,
      date: new Date()
    });
    
    await job.save();
    res.json({ 
      message: 'Hujjatlar yuristga yuborildi',
      job
    });
  } catch (err) {
    console.error('Yuristga yuborishda xatolik:', err);
    res.status(500).json({ message: 'Server xatoligi', error: err.message });
  }
});

// POST /api/job-actions/:id/accept-by-lawyer — Yurist tomonidan ishni qabul qilish
router.post('/:id/accept-by-lawyer', authenticate, async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const userId = req.user.id;

  try {
    if (req.user.role !== 'yurist' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Faqat yuristlar ish qabul qila oladi' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    if (job.status !== 'to_lawyer') {
      return res.status(400).json({ message: 'Bu ish yuristga yuborilmagan' });
    }

    // Ishni qabul qilish
    job.status = 'lawyer_processing';
    if (comment) job.comments += '\n' + comment;
    
    // Tarixga yozish
    job.history.push({
      action: 'Yurist tomonidan qabul qilindi',
      status: 'lawyer_processing',
      updatedBy: userId,
      reason: comment || '',
      date: new Date()
    });

    await job.save();
    res.json({ message: 'Ish qabul qilindi', job });
  } catch (err) {
    console.error('Ishni qabul qilishda xatolik:', err);
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
});

// POST /api/job-actions/:id/complete-by-lawyer — Yurist tomonidan ishni yakunlash
router.post('/:id/complete-by-lawyer', authenticate, async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const userId = req.user.id;

  try {
    if (req.user.role !== 'yurist' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Faqat yuristlar ish yakunlay oladi' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    if (job.status !== 'lawyer_processing') {
      return res.status(400).json({ message: 'Bu ish yurist tomonidan jarayonda emas' });
    }

    // Ishni yakunlash
    job.status = 'lawyer_completed';
    if (comment) job.comments += '\n' + comment;
    
    // Tarixga yozish
    job.history.push({
      action: 'Yurist tomonidan yakunlandi',
      status: 'lawyer_completed',
      updatedBy: userId,
      reason: comment || '',
      date: new Date()
    });

    await job.save();
    res.json({ message: 'Ish yakunlandi', job });
  } catch (err) {
    console.error('Ishni yakunlashda xatolik:', err);
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
});

// POST /api/job-actions/:id/submit-documents - Hujjatlarni tekshiruvchiga yuborish
router.post('/:id/submit-documents', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { personType, yuridikDocs, jismoniyDocs } = req.body;
    const userId = req.user.id;
    
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    
    // Faqat operator/admin hujjat yubora oladi
    if (req.user.role !== 'operator' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Sizda hujjat yuborish huquqi yo\'q' });
    }
    
    // Faqat tasdiqlangan brendlar uchun
    if (job.status !== 'approved' && job.status !== 'documents_pending') {
      return res.status(400).json({ message: 'Bu ish hujjat yuborish holatida emas' });
    }
    
    // Hujjatlarni saqlash
    job.personType = personType;
    if (personType === 'yuridik') {
      job.yuridikDocs = yuridikDocs;
    } else if (personType === 'jismoniy') {
      job.jismoniyDocs = jismoniyDocs;
    }
    
    // Status o'zgartirish
    job.status = 'documents_submitted';
    
    // Tarixga yozish
    job.history.push({
      action: 'Hujjatlar tekshiruvchiga yuborildi',
      status: 'documents_submitted',
      updatedBy: userId,
      date: new Date()
    });
    
    await job.save();
    res.json({ message: 'Hujjatlar yuborildi', job });
  } catch (err) {
    console.error('Hujjat yuborishda xatolik:', err);
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
});

// POST /api/job-actions/:id/return-documents — Tekshiruvchi tomonidan hujjatlarni qaytarish
router.post('/:id/return-documents', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    
    if (!reason) {
      return res.status(400).json({ message: 'Qaytarish sababi ko\'rsatilishi shart' });
    }
    
    // Faqat tekshiruvchi/admin qaytara oladi
    if (req.user.role !== 'tekshiruvchi' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Sizda hujjatlarni qaytarish huquqi yo\'q' });
    }
    
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    
    // Faqat yuborilgan hujjatlarni qaytarish mumkin
    if (job.status !== 'documents_submitted') {
      return res.status(400).json({ message: 'Bu ish hujjatlarni qaytarish holatida emas' });
    }
    
    // Status o'zgartirish va izoh qo'shish
    job.status = 'documents_returned';
    job.comments = reason;
    
    // Tarixga yozish
    job.history.push({
      action: 'Hujjatlar operatorga qaytarildi',
      status: 'documents_returned',
      reason: reason,
      updatedBy: userId,
      date: new Date()
    });
    
    await job.save();
    res.json({ message: 'Hujjatlar operatorga qaytarildi', job });
  } catch (err) {
    console.error('Hujjatlarni qaytarishda xatolik:', err);
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
});

// Generate and send PDF for power of attorney
router.get('/jobs/:id/power-of-attorney-pdf', auth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    
    if (!job.powerOfAttorney || !job.powerOfAttorney.content) {
      return res.status(400).json({ message: 'Bu ish uchun ishonchnoma mavjud emas' });
    }
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Generate a unique filename for the PDF
    const fileName = `powerOfAttorney_${jobId}_${uuidv4()}.pdf`;
    const filePath = path.join(tempDir, fileName);
    
    // Launch a headless browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set the HTML content
    await page.setContent(job.powerOfAttorney.content, {
      waitUntil: 'networkidle0'
    });
    
    // Generate PDF
    await page.pdf({
      path: filePath,
      format: 'A4',
      margin: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm'
      }
    });
    
    // Close the browser
    await browser.close();
    
    // Send the PDF file
    res.download(filePath, `ishonchnoma_${job.clientName || 'mijoz'}.pdf`, (err) => {
      if (err) {
        console.error('PDF yuborishda xatolik:', err);
      }
      
      // Delete the file after sending
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Vaqtinchalik faylni o\'chirishda xatolik:', unlinkErr);
        }
      });
    });
    
  } catch (error) {
    console.error('PDF generatsiya qilishda xatolik:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// Save power of attorney data
router.post('/jobs/:id/power-of-attorney', auth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const { content, personType, classes, format } = req.body;
    
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    
    // Save power of attorney data
    job.powerOfAttorney = {
      content,
      personType,
      classes,
      format,
      createdAt: new Date(),
      createdBy: req.user.id
    };
    
    await job.save();
    
    res.status(200).json({ message: 'Ishonchnoma saqlandi' });
    
  } catch (error) {
    console.error('Ishonchnomani saqlashda xatolik:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

module.exports = router;