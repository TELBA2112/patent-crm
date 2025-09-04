const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = mongoose.model('Job');  // Model is now properly loaded first in index.js
// Use the actual middleware function, not the whole module object
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Fayl yuklash (invoice va guvohnoma uchun) - uploads/ ichiga saqlaymiz
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Brendni tekshiruvchiga yuborish
router.post('/:jobId/send-for-review', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { brandName, classes } = req.body;
    
    if (!brandName) {
      return res.status(400).json({ message: 'Brend nomi kiritilmagan' });
    }
    
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

// Tekshiruvchi uchun brend tekshiruvi natijasini saqlash
router.post('/:jobId/review-brand', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { approved, reason } = req.body;
    
    console.log(`[TEKSHIRUV] Kelgan ma'lumot:`, req.body);
    
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    
    // Tekshiruv natijasiga ko'ra statusni yangilash
    if (approved === true) {
      job.status = 'approved';
      job.reviewResult = { approved: true, date: new Date() };
      console.log(`[TEKSHIRUV] Job ${jobId} - "${job.brandName}" brendi TASDIQLANDI`);
    } else {
      job.status = 'returned_to_operator';
      job.reviewResult = { 
        approved: false, 
        reason: reason || 'Sabab ko\'rsatilmagan', 
        date: new Date() 
      };
      console.log(`[TEKSHIRUV] Job ${jobId} - "${job.brandName}" brendi RAD ETILDI: ${reason}`);
    }
    
    job.updatedAt = new Date();
    await job.save();
    
    return res.status(200).json({ 
      message: approved ? 'Brend tasdiqlandi' : 'Brend rad etildi va operatorga qaytarildi', 
      status: job.status,
      brandName: job.brandName
    });
  } catch (err) {
    console.error('Brend tekshiruvi natijasini saqlashda xatolik:', err);
    return res.status(500).json({ 
      message: 'Brend tekshiruvi natijasini saqlashda serverda xatolik', 
      error: err.message 
    });
  }
});

// Hujjatlarni yuborish
router.post('/:jobId/submit-documents', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { personType, classes, yuridikDocs, jismoniyDocs } = req.body;
    
    if (!personType) {
      return res.status(400).json({ message: 'Shaxs turi kiritilmagan' });
    }
    
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
    return res.status(200).json({ 
      message: 'Hujjatlar muvaffaqiyatli yuborildi', 
      personType: job.personType,
      status: job.status
    });
  } catch (err) {
    console.error('Hujjatlarni yuborishda xatolik:', err);
    return res.status(500).json({ 
      message: 'Hujjatlarni yuborishda serverda xatolik', 
      error: err.message 
    });
  }
});

// Ishonchnoma uchun ma'lumotlarni yuklash
router.get('/:jobId/power-of-attorney', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    
    // JSHHR va boshqa ma'lumotlar
    return res.status(200).json({
      jshshr: '31234567890123', // Haqiqiy holatlarda bu ma'lumot qayerdandir olinishi kerak
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
    return res.status(500).json({
      message: 'Ishonchnoma ma\'lumotlarini olishda xatolik',
      error: err.message
    });
  }
});

// Tekshiruvchidan yuristga yuborish
router.post('/:jobId/send-to-lawyer', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { comment } = req.body || {};
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });
    job.status = 'to_lawyer';
    job.history = job.history || [];
    job.history.push({ status: 'to_lawyer', comment: comment || '', updatedBy: req.user?._id });
    await job.save();
    res.json({ message: 'Yuristga yuborildi', status: job.status });
  } catch (err) {
    console.error('send-to-lawyer xatolik:', err);
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Hujjatlarni operatorga qaytarish
router.post('/:jobId/return-documents', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { reason } = req.body || {};
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });
    job.status = 'returned_to_operator';
    job.history = job.history || [];
    job.history.push({ status: 'returned_to_operator', comment: reason || '', updatedBy: req.user?._id });
    await job.save();
    res.json({ message: 'Hujjatlar operatorga qaytarildi', status: job.status });
  } catch (err) {
    console.error('return-documents xatolik:', err);
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Yurist ishni qabul qiladi
router.post('/:jobId/accept-by-lawyer', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { comment } = req.body || {};
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });
    job.status = 'lawyer_processing';
    job.history = job.history || [];
    job.history.push({ status: 'lawyer_processing', comment: comment || '', updatedBy: req.user?._id });
    await job.save();
    res.json({ message: 'Ish qabul qilindi', status: job.status });
  } catch (err) {
    console.error('accept-by-lawyer xatolik:', err);
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Yurist ishni yakunlaydi va guvohnomani yuklaydi
router.post('/:jobId/complete-by-lawyer', authenticate, upload.array('certificates', 5), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { comment } = req.body || {};
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    const files = (req.files || []).map(f => `/uploads/${path.basename(f.path)}`);
    job.certificates = [...(job.certificates || []), ...files];
    job.status = 'lawyer_completed';
    job.history = job.history || [];
    job.history.push({ status: 'lawyer_completed', comment: comment || '', updatedBy: req.user?._id });
    await job.save();
    res.json({ message: 'Ish yakunlandi', status: job.status, certificates: job.certificates });
  } catch (err) {
    console.error('complete-by-lawyer xatolik:', err);
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Yurist to'lov hisobini yuboradi
router.post('/:jobId/send-invoice', authenticate, upload.single('invoiceFile'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { amount, comment, classes } = req.body || {};
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });
    const fileUrl = req.file ? `/uploads/${path.basename(req.file.path)}` : undefined;
    job.invoice = {
      amount: amount ? Number(amount) : undefined,
      comment: comment || '',
      file: fileUrl,
      classes: classes ? JSON.parse(classes) : undefined,
      date: new Date()
    };
    job.history = job.history || [];
    job.history.push({ status: 'invoice_sent', comment: comment || '', updatedBy: req.user?._id });
    await job.save();
    res.json({ message: 'Invoice yuborildi', invoice: job.invoice });
  } catch (err) {
    console.error('send-invoice xatolik:', err);
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Yurist hujjatlarni saqlaydi (JSON, base64 rasmlar bo'lishi mumkin)
router.post('/:jobId/save-lawyer-docs', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { documentData } = req.body || {};
    if (!documentData) return res.status(400).json({ message: 'documentData yo\'q' });
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });
    job.documentData = { ...(job.documentData || {}), ...documentData };
    job.history = job.history || [];
    job.history.push({ status: 'lawyer_docs_saved', comment: '', updatedBy: req.user?._id });
    await job.save();
    res.json({ message: 'Hujjatlar saqlandi', documentData: job.documentData });
  } catch (err) {
    console.error('save-lawyer-docs xatolik:', err);
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

module.exports = router;