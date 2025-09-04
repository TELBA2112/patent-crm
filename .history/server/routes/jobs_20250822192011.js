const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer sozlamalari
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/certificates');
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage: storage });

// Middleware - ishlovchilarni yuklashda foydalaniladigan yordamchi funksiya
const populateJob = (query) => {
  return query
    .populate('assignedTo', 'username role')
    .populate('tekshiruvchi', 'username')
    .populate('yurist', 'username')
    .populate('history.updatedBy', 'username');
};

// ======================
// MAXSUS ROUTELAR AVVAL
// ======================

// POST /api/jobs/:id/send-for-review — Brendni tekshiruvchiga yuborish
router.post('/:id/send-for-review', authenticate, async (req, res) => {
  const { id } = req.params;
  const { brandName } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    // Faqat operator yoki admin yuborishi mumkin
    if (role !== 'operator' && role !== 'admin') {
      return res.status(403).json({ message: 'Sizda brend yuborish uchun ruxsat yo‘q' });
    }

    // Ish operatorga tegishli ekanligini tekshirish
    if (role === 'operator' && job.assignedTo?.toString() !== userId) {
      return res.status(403).json({ message: 'Sizda bu ishni yuborish uchun ruxsat yo‘q' });
    }

    // Tekshiruvchi topish
    const tekshiruvchi = await User.findOne({ role: 'tekshiruvchi' });
    if (!tekshiruvchi) {
      return res.status(400).json({ message: 'Tekshiruvchi topilmadi' });
    }

    // Ishni yangilash
    job.brandName = brandName;
    job.status = 'brand_in_review';
    job.tekshiruvchi = tekshiruvchi._id;
    job.history.push({
      action: 'Brend tekshiruvchiga yuborildi',
      status: 'brand_in_review',
      updatedBy: userId
    });

    await job.save();
    res.json({ message: 'Brend tekshiruvchiga yuborildi', job });
  } catch (err) {
    console.error('Brend yuborishda xatolik:', err);
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
});

// POST /api/jobs/:id/upload — Guvohnoma faylini yuklash
router.post('/:id/upload', authenticate, upload.single('certificate'), async (req, res) => {
  if (req.user.role !== 'yurist') {
    return res.status(403).json({ message: 'Faqat yurist guvohnoma yuklashi mumkin' });
  }

  const { id } = req.params;
  const userId = req.user.id;

  try {
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    
    if (job.yurist?.toString() !== userId) {
      return res.status(403).json({ message: 'Siz bu ishga ruxsatga ega emassiz' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Fayl yuklanmadi' });
    }

    job.certificatesPath = req.file.path;
    job.status = 'finished';
    
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

// ======================
// QOLGAN ROUTELAR
// ======================

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
      filter.status = 'brand_in_review';
    } else if (role === 'yurist') {
      filter.yurist = userId;
      filter.status = 'to_lawyer';
    } else if (role === 'admin') {
      if (assignedTo) filter.assignedTo = assignedTo;
      if (status) filter.status = status;
    } else {
      return res.status(403).json({ message: 'Ruxsat yo‘q' });
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ brandName: regex }, { clientName: regex }, { 'jobNo': parseInt(search) || null }];
    }

    const jobs = await populateJob(Job.find(filter));
    res.json(jobs);
  } catch (err) {
    console.error('Ishlarni olishda xatolik:', err);
    res.status(500).json({ message: 'Serverda xatolik' });
  }
});

// GET /api/jobs/:id — Ishni batafsil olish
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const job = await populateJob(Job.findById(id));
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    if (req.user.role !== 'admin' && job.assignedTo?.toString() !== req.user.id && job.tekshiruvchi?.toString() !== req.user.id && job.yurist?.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Siz bu ishga ruxsatga ega emassiz' });
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Serverda xatolik' });
  }
});

// POST /api/jobs — Yangi ish yaratish (faqat operator)
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'operator') {
    return res.status(403).json({ message: 'Faqat operatorlar yangi ish yaratishi mumkin' });
  }

  try {
    const { clientName, clientSurname, phone } = req.body;
    const newJob = new Job({
      clientName,
      clientSurname,
      phone,
      status: 'yangi',
      assignedTo: req.user.id,
      history: [{ action: 'Ish yaratildi', status: 'yangi', updatedBy: req.user.id }]
    });

    await newJob.save();
    res.status(201).json(newJob);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Yangi ish yaratishda xatolik' });
  }
});

// PATCH /api/jobs/:id — Ish statusini yangilash
router.patch('/:id', authenticate, async (req, res) => {
  // ... sizning mavjud kod
});

module.exports = router;
