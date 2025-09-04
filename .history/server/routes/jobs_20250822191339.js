const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
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
      // Tekshiruvchi o'ziga biriktirilgan ishlarni ko'radi
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
    // Faqat tegishli foydalanuvchilar ko'ra oladi
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
  const { id } = req.params;
  const { status, brandName, brandLogo, comments, tekshiruvchiId, yuristId, personType, yuridikDocs, jismoniyDocs } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    const addHistory = (action, newStatus, reason) => {
      job.history.push({
        action: action,
        status: newStatus,
        reason: reason,
        updatedBy: userId,
        date: new Date()
      });
    };
    
    // Operator harakatlari
    if (role === 'operator') {
      if (job.assignedTo?.toString() !== userId) {
          return res.status(403).json({ message: 'Siz bu ishni o‘zgartirishga ruxsat yo‘q' });
      }
      
      if (status === 'brand_in_review') {
          if (!brandName) { 
              return res.status(400).json({ message: 'Brend nomi shart' });
          }
          job.brandName = brandName;
          job.brandLogo = brandLogo;
          job.status = 'brand_in_review';
          addHistory('Brend tekshiruvga yuborildi', 'brand_in_review');
      } else if (status === 'documents_pending') {
          if (!personType) {
              return res.status(400).json({ message: 'Shaxs turi tanlanishi shart' });
          }
          job.personType = personType;
          if (personType === 'yuridik') {
              job.yuridikDocs = yuridikDocs;
          } else {
              job.jismoniyDocs = jismoniyDocs;
          }
          job.status = 'documents_pending';
          addHistory('Hujjatlar yig‘ish boshlandi', 'documents_pending');
      } else {
        // Operatorning boshqa harakatlari
        job.status = status;
        job.callResult = req.body.callResult;
        job.clientIntent = req.body.clientIntent;
        job.futureDate = req.body.futureDate;
        addHistory('Status yangilandi', status);
      }
    }

    // Tekshiruvchi harakatlari
    else if (role === 'tekshiruvchi') {
        if (job.tekshiruvchi?.toString() !== userId) {
            return res.status(403).json({ message: 'Siz bu ishni o‘zgartirishga ruxsat yo‘q' });
        }
        if (status === 'approved' || status === 'rejected') {
            job.status = status;
            job.comments = comments;
            addHistory(`Brend ${status === 'approved' ? 'ma‘qullandi' : 'rad etildi'}`, status, comments);
        } else if (status === 'to_lawyer') {
            if (!yuristId) {
                return res.status(400).json({ message: 'Yurist tanlash shart' });
            }
            job.status = 'to_lawyer';
            job.yurist = yuristId;
            addHistory('Ish yuristga yuborildi', 'to_lawyer', comments);
        }
    }

    // Yurist harakatlari
    else if (role === 'yurist') {
        if (job.yurist?.toString() !== userId) {
            return res.status(403).json({ message: 'Siz bu ishni o‘zgartirishga ruxsat yo‘q' });
        }
        if (status === 'finished') {
            job.status = 'finished';
            addHistory('Ish yakunlandi', 'finished', 'Guvohnoma yuklandi');
        } else if (status === 'returned_to_inspector') {
            if (!comments) {
                return res.status(400).json({ message: 'Qaytarish sababini kiritish shart' });
            }
            job.status = 'returned_to_inspector';
            job.comments = comments;
            addHistory('Ish tekshiruvchiga qaytarildi', 'returned_to_inspector', comments);
        }
    }

    // Admin harakatlari
    else if (role === 'admin') {
      if(status) {
        job.status = status;
        job.comments = comments;
        addHistory('Admin tomonidan status o‘zgartirildi', status, comments);
      }
      if(req.body.assignedTo) job.assignedTo = req.body.assignedTo;
      if(req.body.tekshiruvchiId) job.tekshiruvchi = req.body.tekshiruvchiId;
      if(req.body.yuristId) job.yurist = req.body.yuristId;
    }

    await job.save();
    res.json(job);
  } catch (err) {
    console.error('Ishni yangilashda xatolik:', err);
    res.status(500).json({ message: 'Serverda xatolik' });
  }
});
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

module.exports = router;