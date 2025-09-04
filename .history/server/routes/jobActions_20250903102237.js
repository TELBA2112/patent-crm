const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = mongoose.model('Job');  // Model is now properly loaded first in index.js
// Use the actual middleware function, not the whole module object
const { authenticate } = require('../middleware/auth');
const stream = require('stream');

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

// Ishonchnomani PDF formatida chiqarish (oddiy HTML -> PDF o'rnini bosuvchi: HTML faylni beramiz)
// Agar haqiqiy PDF kerak bo'lsa, html-pdf, puppeteer yoki pdf-lib kutubxonalaridan foydalaning.
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
    if (!html.includes('Faoliyat turi') && mktuLabel) {
      html = `
        <div style="text-align:right; font-family:'Times New Roman', serif; margin-bottom:10px;">
          <span><strong>Faoliyat turi (MKTU):</strong> ${mktuLabel}</span>
        </div>
      ` + html;
    }
    if (!html.includes('Ишончнома берилган сана')) {
      html = html.replace('</div>', `<p style="margin-top:10px;"><strong>Ишончнома берилган сана:</strong> ${dateStr}</p></div>`);
    }

    // Minimal HTML hujjat sifatida yuboramiz, Content-Type PDF emas, lekin brauzer yuklaydi
    // Agar haqiqiy PDF kerak bo'lsa, keyingi qadamda kutubxona qo'shamiz.
    const docTitle = `ishonchnoma_${job.clientName || 'mijoz'}.html`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${docTitle}"`);
    res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Ishonchnoma</title></head><body>${html}</body></html>`);
  } catch (err) {
    console.error('Ishonchnomani PDFga chiqarishda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

module.exports = router;