const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Job = require('../models/Job');
const { authenticate } = require('../middleware/auth');

// Middleware - ishlovchilarni yuklashda foydalaniladigan yordamchi funksiya
const populateJob = (query) => {
  return query
    .populate('assignedTo', 'username role')
    .populate('tekshiruvchi', 'username')
    .populate('yurist', 'username')
    .populate('history.updatedBy', 'username');
};

// GET /api/jobs — Barcha ishlarni olish (filterlar bilan)
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const { status, assignedTo, search } = req.query;

  try {
    let filter = {};
    if (role === 'operator') {
      filter.assignedTo = userId;
    } else if (role === 'tekshiruvchi') {
      filter.tekshiruvchi = userId;
      filter.status = 'brand_in_review'; // Faqat shu statusdagi ishlarni ko'rsatish 
    } else if (role === 'admin') {
      if (assignedTo) filter.assignedTo = assignedTo;
    } else {
      return res.status(403).json({ message: 'Ruxsat yo‘q' });
    }

    if (status) filter.status = status;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { clientName: regex },
        { clientSurname: regex },
        { phone: regex },
        { brandName: regex }
      ];
      if (mongoose.Types.ObjectId.isValid(search)) {
        filter.$or.push({ _id: search });
      }
    }

    const jobs = await populateJob(Job.find(filter).sort({ createdAt: -1 }));
    res.json(jobs);
  } catch (err) {
    console.error('Jobs GET error:', err);
    res.status(500).json({ message: 'Ishlarni olishda xatolik: ' + err.message });
  }
});

// POST /api/jobs — Yangi ish yaratish
router.post('/', authenticate, async (req, res) => {
  const role = req.user.role;
  if (role !== 'operator' && role !== 'admin') {
    return res.status(403).json({ message: 'Faqat operator yoki admin yangi ish qo‘shishi mumkin' });
  }

  const { clientName, clientSurname, phone, brandName, personType } = req.body;

  try {
    if (!clientName || !clientSurname || !phone || !personType) {
      return res.status(400).json({ message: 'Barcha asosiy maydonlar to‘ldirilishi shart' });
    }
    if (!['yuridik', 'jismoniy'].includes(personType)) {
      return res.status(400).json({ message: "Shaxs turi noto'g'ri. ('yuridik' yoki 'jismoniy' bo'lishi kerak)" });
    }

    const newJob = new Job({
      clientName,
      clientSurname,
      phone,
      brandName,
      personType,
      status: 'yangi',
      assignedTo: req.user.id,
      history: [{
        action: 'Yangi ish yaratildi',
        status: 'yangi',
        updatedBy: req.user.id,
      }],
      // Qolgan maydonlar default qiymat bilan qoladi
    });
    
    await newJob.save();
    res.status(201).json(newJob);
  } catch (err) {
    console.error('Jobs POST error:', err);
    res.status(500).json({ message: 'Ish yaratishda xatolik: ' + err.message });
  }
});

// PUT /api/jobs/:id — Ishni yangilash
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const role = req.user.role;
  const userId = req.user.id;

  try {
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    
    if (role !== 'admin' && job.assignedTo?.toString() !== userId) {
      return res.status(403).json({ message: 'Sizda bu ishni yangilash uchun ruxsat yo‘q' });
    }

    const updates = req.body;
    const historyEntry = {
      action: 'Ish yangilandi',
      status: updates.status || job.status,
      updatedBy: userId,
      reason: updates.comments || '',
    };
    
    if (updates.status && updates.status !== job.status) {
      historyEntry.action = `Status o'zgartirildi: ${job.status} -> ${updates.status}`;
    }

    if (updates.yuridikDocs) job.yuridikDocs = updates.yuridikDocs;
    if (updates.jismoniyDocs) job.jismoniyDocs = updates.jismoniyDocs;

    Object.keys(updates).forEach(key => {
      if (key !== 'history' && updates[key] !== undefined) {
        job[key] = updates[key];
      }
    });

    job.history.push(historyEntry);
    await job.save();

    res.json({ message: 'Ish muvaffaqiyatli yangilandi', job });
  } catch (err) {
    console.error('Jobs PUT error:', err);
    res.status(500).json({ message: 'Ishni yangilashda xatolik: ' + err.message });
  }
});

// Yangi route: Brendni tekshiruvchiga yuborish
router.post('/:id/send-for-review', authenticate, async (req, res) => {
  const { id } = req.params;
  const { brandName } = req.body;
  const userId = req.user.id;

  if (req.user.role !== 'operator') {
    return res.status(403).json({ message: "Faqat operator brendni tekshiruvga yuborishi mumkin" });
  }

  if (!brandName) {
    return res.status(400).json({ message: "Brend nomi majburiy" });
  }

  try {
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    job.brandName = brandName;
    job.status = 'brand_in_review';
    job.history.push({
      action: 'Brend nomi tekshiruvga yuborildi',
      status: 'brand_in_review',
      updatedBy: userId,
    });
    
    await job.save();
    res.json(job);
  } catch (err) {
    console.error('Send for review error:', err);
    res.status(500).json({ message: 'Brendni tekshiruvga yuborishda xatolik: ' + err.message });
  }
});

// DELETE /api/jobs/:id — Ishni o‘chirish (faqat admin)
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const role = req.user.role;

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Faqat admin o‘chira oladi' });
  }

  try {
    const job = await Job.findByIdAndDelete(id);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    res.json({ message: 'Ish muvaffaqiyatli o‘chirildi' });
  } catch (err) {
    console.error('Jobs DELETE error:', err);
    res.status(500).json({ message: 'Ishni o‘chirishda xatolik: ' + err.message });
  }
});

// GET /api/jobs/:id/history — Ishning barcha tarixini olish
router.get('/:id/history', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const job = await Job.findById(id)
      .populate('history.updatedBy', 'username')
      .select('history');

    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    res.json(job.history);
  } catch (err) {
    console.error('Jobs HISTORY error:', err);
    res.status(500).json({ message: 'Ish tarixini olishda xatolik: ' + err.message });
  }
});

// PUT /api/jobs/:id/assign — ishni boshqa rolga o'tkazish
router.put('/:id/assign', authenticate, async (req, res) => {
  const { id } = req.params;
  const { newStatus, comment, newAssignedTo } = req.body;

  try {
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    if (newStatus) job.status = newStatus;
    if (newAssignedTo) job.assignedTo = newAssignedTo;

    job.history.push({
      action: 'Ish assign qilindi',
      status: newStatus || job.status,
      reason: comment || '',
      updatedBy: req.user.id
    });

    await job.save();
    res.json({ message: 'Ish muvaffaqiyatli yangilandi', job });
  } catch (err) {
    console.error('Jobs ASSIGN error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});
// POST /api/jobs/:id/review-brand — tekshiruvchi brend nomini tekshiradi
router.post('/:id/review-brand', authenticate, async (req, res) => {
  const { status, reason } = req.body; // status: 'approved' yoki 'rejected'
  const userId = req.user.id;

  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });
    if (String(job.tekshiruvchi) !== userId) {
      return res.status(403).json({ message: 'Siz bu ishni tekshirishga ruxsatga ega emassiz' });
    }

    job.status = (status === 'approved') ? 'to_lawyer' : 'brand_rejected';
    
    // Tarixga yozish
    job.history.push({ 
      action: status === 'approved' ? 'Brend ma\'qullandi' : 'Brend rad etildi',
      status: job.status,
      reason: reason || 'Sabab ko\'rsatilmagan',
      updatedBy: userId
    });

    await job.save();
    res.json(job);
  } catch (err) {
    console.error('Brendni tekshirishda xatolik:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// POST /api/jobs/:id/upload-certificates — yurist .rar faylini yuklaydi
router.post('/:id/upload-certificates', authenticate, upload.single('certificates'), async (req, res) => {
  const userId = req.user.id;
  
  if (!req.file) {
    return res.status(400).json({ message: 'Fayl yuklanmadi.' });
  }

  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });
    // Yuristga biriktirilganligini tekshirish
    if (String(job.tekshiruvchi) !== userId) {
      // Bu yerda balki 'yurist'ga biriktirilganligi tekshiriladi
      // `job.yurist` degan maydon bo'lsa, shuni ishlatish kerak. Hozircha `tekshiruvchi` maydonini ishlatdim,
      // lekin `Job` modeliga alohida yurist uchun maydon qo'shish yaxshi bo'ladi.
      return res.status(403).json({ message: 'Siz bu ishga ruxsatga ega emassiz' });
    }
    
    job.certificatesPath = req.file.path; // Fayl yo'lini saqlash
    job.status = 'certificates_ready';
    
    // Tarixga yozish
    job.history.push({ 
      action: 'Guvohnoma yuklandi', 
      status: job.status, 
      updatedBy: userId 
    });

    await job.save();
    res.json(job);
  } catch (err) {
    console.error('Fayl yuklashda xatolik:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});
// GET /api/jobs/:id — admin uchun ish va barcha tafsilotlari (history bilan)
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const role = req.user.role;

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Faqat admin ko‘ra oladi' });
  }

  try {
    const job = await Job.findById(id)
      .populate('assignedTo', 'username role')
      .populate('tekshiruvchi', 'username role')
      .populate('history.updatedBy', 'username role');
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });
    res.json(job);
  } catch (err) {
    console.error('Jobs GET BY ID error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});
module.exports = router;