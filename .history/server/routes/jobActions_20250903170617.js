const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = mongoose.model('Job');  // Model is now properly loaded first in index.js
// Use the actual middleware function, not the whole module object
const { authenticate } = require('../middleware/auth');
const stream = require('stream');
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');
const { uploadAny } = require('../middleware/upload');
const Notification = require('../models/Notification');

// Yordamchi funksiyalar
function formatDateDDMMYYYY(d) {
  const date = d instanceof Date ? d : new Date(d);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function formatMktuLabel(classes = []) {
  const nums = (Array.isArray(classes) ? classes : [])
    .map((c) => parseInt(c))
    .filter((n) => !isNaN(n));
  if (nums.length === 0) return '';
  const uniq = [...new Set(nums)].sort((a, b) => a - b);
  const joined = uniq.join(',');
  return uniq.length > 1 ? `${joined} - sinflar` : `${joined} - sinf`;
}

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
    let { approved, reason, status } = req.body;
    // Backward compatibility: if client sent { status: 'approved' | 'rejected' }
    if (typeof approved === 'undefined' && typeof status === 'string') {
      approved = status === 'approved';
    }
    
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

// Hujjatlar tasdiqlanib yuristga yuboriladi
router.post('/:jobId/send-to-lawyer', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { comment } = req.body || {};
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    job.status = 'to_lawyer';
    job.updatedAt = new Date();
    job.history = job.history || [];
    job.history.push({ status: 'to_lawyer', comment: comment || 'Yuristga yuborildi', date: new Date() });
    await job.save();
  // Notify lawyer role
  await Notification.create({ role: 'yurist', job: job._id, type: 'to_lawyer', title: 'Yangi ish yuristga yuborildi', message: job.brandName || '', link: `/jobs/${job._id}` });
    return res.json({ message: 'Yuristga yuborildi', status: job.status, documents: job.documents || [] });
  } catch (err) {
    console.error('Yuristga yuborishda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Hujjatlarni operatorga qaytarish
router.post('/:jobId/return-documents', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { reason } = req.body || {};
    if (!reason) return res.status(400).json({ message: 'Sabab kiritilmadi' });
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    job.status = 'returned_to_operator';
    job.updatedAt = new Date();
    job.history = job.history || [];
    job.history.push({ status: 'returned_to_operator', comment: reason, date: new Date() });
    await job.save();
  // Notify operator role
  await Notification.create({ role: 'operator', job: job._id, type: 'documents_returned', title: 'Hujjatlar qaytarildi', message: reason || '', link: `/jobs/${job._id}` });
    return res.json({ message: 'Operatorga qaytarildi', status: job.status });
  } catch (err) {
    console.error('Hujjatlarni qaytarishda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Yurist tomonidan invoice (to'lov hisobi) yuborish (rasm yoki PDF)
router.post('/:jobId/send-invoice', authenticate, upload.single('invoiceFile'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { amount, comment } = req.body || {};
    if (!req.file) return res.status(400).json({ message: 'Invoice fayli kiritilmadi' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    job.invoices = job.invoices || [];
    job.invoices.push({
      amount: amount ? Number(amount) : undefined,
      comment: comment || '',
      filePath: req.file.path,
      status: 'pending',
      createdAt: new Date()
    });
    await job.save();
  // Notify tekshiruvchi role to pay
  await Notification.create({ role: 'tekshiruvchi', job: job._id, type: 'invoice_sent', title: 'To\'lov uchun hisob yuborildi', message: `Mijoz: ${job.clientName || ''} ${job.clientSurname || ''}`, link: `/jobs/${job._id}` });
    return res.json({ message: 'Invoice yuborildi', invoices: job.invoices });
  } catch (err) {
    console.error('Invoice yuborishda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Tekshiruvchi uchun: to'lanishi kerak bo'lgan invoice-larni olish
router.get('/pending-invoices', authenticate, async (req, res) => {
  try {
    const jobs = await Job.find({ 'invoices.status': 'pending' })
      .select('clientName clientSurname phone brandName invoices');
    // Flatten response for convenience
    const items = [];
    for (const j of jobs) {
      (j.invoices || []).forEach(inv => {
        if (inv.status === 'pending') {
          items.push({ jobId: j._id, clientName: j.clientName, clientSurname: j.clientSurname, phone: j.phone, brandName: j.brandName, invoice: inv });
        }
      });
    }
    return res.json(items);
  } catch (err) {
    console.error('Pending invoice-larni olishda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Tekshiruvchi: to'lov chekini yuklab, invoice'ni paid qilish
router.post('/:jobId/invoices/:invoiceId/upload-receipt', authenticate, uploadAny.single('receipt'), async (req, res) => {
  try {
    const { jobId, invoiceId } = req.params;
    if (!req.file) return res.status(400).json({ message: 'Chek fayli kiritilmadi' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    const inv = (job.invoices || []).id(invoiceId);
    if (!inv) return res.status(404).json({ message: 'Invoice topilmadi' });

  inv.status = 'receipt_uploaded';
  inv.receiptPath = req.file.path;
    await job.save();
  job.history = job.history || [];
  job.history.push({ status: 'receipt_uploaded', comment: 'Tekshiruvchi chekni yukladi', date: new Date() });
  await job.save();
  // Notify lawyer to approve
  await Notification.create({ role: 'yurist', job: job._id, type: 'receipt_uploaded', title: 'To\'lov cheki yuklandi', message: job.brandName || '', link: `/jobs/${job._id}` });
  return res.json({ message: 'Chek yuklandi (tasdiqlash kutilmoqda)', invoice: inv });
  } catch (err) {
    console.error('Chek yuklashda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Yurist: tekshiruvchi yuklagan chekni ko'rib, to'lovni tasdiqlaydi
router.post('/:jobId/invoices/:invoiceId/approve-receipt', authenticate, async (req, res) => {
  try {
    const { jobId, invoiceId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });
    const inv = (job.invoices || []).id(invoiceId);
    if (!inv) return res.status(404).json({ message: 'Invoice topilmadi' });
    if (inv.status !== 'receipt_uploaded') return res.status(400).json({ message: 'Tasdiqlash uchun mos holat emas' });

    inv.status = 'paid';
    inv.paidAt = new Date();
    await job.save();
    job.history = job.history || [];
    job.history.push({ status: 'paid', comment: 'Yurist to\'lovni tasdiqladi', date: new Date() });
    await job.save();
  // Notify operator and tekshiruvchi that payment is confirmed
  try {
    await Notification.create({ role: 'operator', job: job._id, type: 'receipt_approved', title: 'To\'lov tasdiqlandi', message: job.brandName || '', link: `/jobs/${job._id}` });
    await Notification.create({ role: 'tekshiruvchi', job: job._id, type: 'receipt_approved', title: 'To\'lov tasdiqlandi', message: job.brandName || '', link: `/jobs/${job._id}` });
    if (job.assignedTo) {
      await Notification.create({ user: job.assignedTo, job: job._id, type: 'receipt_approved', title: 'To\'lov tasdiqlandi', message: job.brandName || '', link: `/jobs/${job._id}` });
    }
  } catch (e) { console.warn('Notif error:', e.message); }
    return res.json({ message: 'To\'lov tasdiqlandi', invoice: inv });
  } catch (err) {
    console.error('approve-receipt da xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
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
      createdAt: new Date(),
      mktuLabel: formatMktuLabel(job.classes || [])
    });
  } catch (err) {
    console.error('Ishonchnoma ma\'lumotlarini olishda xatolik:', err);
    return res.status(500).json({
      message: 'Ishonchnoma ma\'lumotlarini olishda xatolik',
      error: err.message
    });
  }
});

// Ishonchnomani saqlash (HTML kontent + meta) va hujjat sifatida biriktirish
router.post('/:jobId/save-power-of-attorney', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { content, personType } = req.body;
    if (!content) return res.status(400).json({ message: 'Kontent talab qilinadi' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    const now = new Date();
    const mktuLabel = formatMktuLabel(job.classes || []);

    job.powerOfAttorney = {
      content,
      personType: personType || job.personType || 'jismoniy',
      date: now,
      mktuLabel,
    };

    // Hujjat sifatida biriktirish (HTML variant)
    job.documents = job.documents || [];
    job.documents.push({
      type: 'power-of-attorney',
      format: 'html',
      content,
      mktuLabel,
      createdAt: now,
    });

    await job.save();
    return res.json({ success: true, powerOfAttorney: job.powerOfAttorney });
  } catch (err) {
    console.error('Ishonchnomani saqlashda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Ishonchnomani PDF formatida chiqarish (Puppeteer orqali)
router.get('/:jobId/power-of-attorney-pdf', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });
    if (!job.powerOfAttorney || !job.powerOfAttorney.content) {
      return res.status(404).json({ message: 'Ishonchnoma topilmadi' });
    }

    // Sana va MKTU ni kontentga qo'shib yuboramiz (agar shablonda bo'lmasa)
    const dateStr = formatDateDDMMYYYY(new Date());
    const mktuLabel = formatMktuLabel(job.classes || []);
    let html = job.powerOfAttorney.content;
    // MKTU: 'Tasviriy belgi' dan keyin qo'yish
    if (mktuLabel && !/Faoliyat turi \(MKTU\)/i.test(html)) {
      const markers = [
        '<strong>Тасвирий белги:</strong>',
        '<strong>Tasviriy belgi:</strong>',
        'Тасвирий белги:',
        'Tasviriy belgi:'
      ];
      let inserted = false;
      for (const marker of markers) {
        const idx = html.indexOf(marker);
        if (idx !== -1) {
          const endP = html.indexOf('</p>', idx);
          if (endP !== -1) {
            const before = html.slice(0, endP + 4);
            const after = html.slice(endP + 4);
            const mktuHtml = `\n<p style=\"margin-bottom: 15px; text-align: justify;\"><strong>Faoliyat turi (MKTU):</strong> ${mktuLabel}</p>`;
            html = before + mktuHtml + after;
            inserted = true;
            break;
          }
        }
      }
      if (!inserted) {
        html += `\n<p style=\"margin-bottom: 15px; text-align: justify;\"><strong>Faoliyat turi (MKTU):</strong> ${mktuLabel}</p>`;
      }
    }
    if (!/Ишончнома берилган сана/.test(html)) {
      html += `\n<p style=\"margin-top:10px;\"><strong>Ишончнома берилган сана:</strong> ${dateStr}</p>`;
    }
    // Puppeteer orqali PDFga render qilish
    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(`<!doctype html><html><head><meta charset=\"utf-8\"><title>Ishonchnoma</title></head><body>${html}</body></html>`, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();

      const docTitle = `ishonchnoma_${job.clientName || 'mijoz'}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=\"${docTitle}\"`);
      return res.send(pdfBuffer);
    } catch (pdfErr) {
      console.warn('Puppeteer orqali PDF yaratib bo\'lmadi, HTMLga qaytmoqda:', pdfErr.message);
      const docTitle = `ishonchnoma_${job.clientName || 'mijoz'}.html`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=\"${docTitle}\"`);
      return res.send(`<!doctype html><html><head><meta charset=\"utf-8\"><title>Ishonchnoma</title></head><body>${html}</body></html>`);
    }
  } catch (err) {
    console.error('Ishonchnomani PDFga chiqarishda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// POST /api/job-actions/:id/accept-by-lawyer — Yurist tomonidan ishni qabul qilish
router.post('/:id/accept-by-lawyer', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    job.status = 'lawyer_processing';
    job.history = job.history || [];
    job.history.push({ status: 'lawyer_processing', comment: (req.body && req.body.comment) || 'Yurist ishni qabul qildi', date: new Date() });
    job.updatedAt = new Date();
    await job.save();

    return res.json({ message: 'Ish yurist tomonidan qabul qilindi', status: job.status });
  } catch (err) {
    console.error('accept-by-lawyer da xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// POST /api/job-actions/:id/save-lawyer-docs — Yurist hujjat maʼlumotlarini yangilaydi
router.post('/:id/save-lawyer-docs', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    const { documentData } = req.body || {};
    if (documentData && typeof documentData === 'object') {
      if (documentData.yuridik) {
        job.yuridikDocs = { ...(job.yuridikDocs || {}), ...documentData.yuridik };
        if (documentData.yuridik.brandName) job.brandName = documentData.yuridik.brandName;
        if (documentData.yuridik.classes) {
          const arr = String(documentData.yuridik.classes)
            .split(',')
            .map(s => parseInt(String(s).trim()))
            .filter(n => !isNaN(n));
          job.classes = [...new Set(arr)].sort((a, b) => a - b);
        }
      }
      if (documentData.jismoniy) {
        job.jismoniyDocs = { ...(job.jismoniyDocs || {}), ...documentData.jismoniy };
        if (documentData.jismoniy.brandName) job.brandName = documentData.jismoniy.brandName;
        if (documentData.jismoniy.classes) {
          const arr = String(documentData.jismoniy.classes)
            .split(',')
            .map(s => parseInt(String(s).trim()))
            .filter(n => !isNaN(n));
          job.classes = [...new Set(arr)].sort((a, b) => a - b);
        }
      }
    }

    job.updatedAt = new Date();
    job.history = job.history || [];
    job.history.push({ status: job.status, comment: 'Yurist hujjat maʼlumotlarini yangiladi', date: new Date() });
    await job.save();

    return res.json({ message: 'Hujjatlar saqlandi', job });
  } catch (err) {
    console.error('save-lawyer-docs da xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// POST /api/job-actions/:id/complete-by-lawyer — Yurist ishni yakunlaydi va guvohnoma biriktiradi
router.post('/:id/complete-by-lawyer', authenticate, uploadAny.single('certificates'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    const comment = (req.body && req.body.comment) || '';
    if (!req.file) return res.status(400).json({ message: 'Guvohnoma fayli kiritilmadi' });

    job.documents = job.documents || [];
    job.documents.push({ type: 'certificate', path: req.file.path, uploadedAt: new Date(), comment });
  job.certificatePath = req.file.path;
    job.status = 'lawyer_completed';
  job.completedAt = new Date();
    job.updatedAt = new Date();
    job.history = job.history || [];
    job.history.push({ status: 'lawyer_completed', comment: comment || 'Yurist ishni yakunladi', date: new Date() });
    await job.save();
  // Notifications: admin & operator
  await Notification.create({ role: 'admin', job: job._id, type: 'job_completed', title: 'Ish yakunlandi', message: job.brandName || '', link: `/jobs/${job._id}` });
  await Notification.create({ role: 'operator', job: job._id, type: 'job_completed', title: 'Guvohnoma tayyor', message: 'Guvohnomani yuklab mijozga yetkazing', link: `/jobs/${job._id}` });

    return res.json({ message: 'Ish yakunlandi va guvohnoma biriktirildi', status: job.status, documents: job.documents });
  } catch (err) {
    console.error('complete-by-lawyer da xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Yurist: bildirishnoma (notification letter) faylini yuklaydi
router.post('/:jobId/upload-notice', authenticate, uploadAny.single('notice'), async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!mongoose.isValidObjectId(jobId)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
    if (!req.file) return res.status(400).json({ message: 'Bildirishnoma fayli kiritilmadi' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    job.documents = job.documents || [];
    job.documents.push({ type: 'notice', path: req.file.path, uploadedAt: new Date(), comment: req.body?.comment || '' });
    job.history = job.history || [];
    job.history.push({ status: job.status, comment: 'Bildirishnoma yuklandi', date: new Date() });
    await job.save();

    await Notification.create({ role: 'operator', job: job._id, type: 'notice_uploaded', title: 'Bildirishnoma yuklandi', message: job.brandName || '', link: `/jobs/${job._id}` });
    await Notification.create({ role: 'tekshiruvchi', job: job._id, type: 'notice_uploaded', title: 'Bildirishnoma yuklandi', message: job.brandName || '', link: `/jobs/${job._id}` });

    return res.json({ message: 'Bildirishnoma yuklandi', documents: job.documents });
  } catch (err) {
    console.error('Bildirishnoma yuklashda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

module.exports = router;