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
    .populate('assignedTo', 'firstName lastName username role')
    .populate('tekshiruvchi', 'firstName lastName username')
    .populate('yurist', 'firstName lastName username')
    .populate('history.updatedBy', 'firstName lastName username');
};

// GET /api/jobs — Barcha ishlarni olish (filterlar bilan)
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const { status, assignedTo, search } = req.query;

  try {
    let filter = {};
    
    // Rolga qarab filter o'rnatish
    if (role === 'operator') {
      filter.assignedTo = userId;
    } else if (role === 'tekshiruvchi') {
      filter.tekshiruvchi = userId;
    } else if (role === 'yurist') {
      filter.yurist = userId;
    } else if (role === 'admin') {
      // Admin barcha ishlarni ko'ra oladi, lekin filter qo'llashi mumkin
      if (assignedTo) filter.assignedTo = assignedTo;
      if (status) filter.status = status;
    } else {
      return res.status(403).json({ message: 'Ruxsat yo'q' });
    }

    // Qidiruv uchun filter qo'shish
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { brandName: regex }, 
        { clientName: regex }, 
        { clientSurname: regex },
        { phone: regex }
      ];
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
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Serverda xatolik' });
  }
});

// POST /api/jobs — Yangi ish yaratish (admin va operator uchun)
router.post('/', authenticate, async (req, res) => {
  try {
    const { clientName, clientSurname, phone, brandName, personType, assignedTo } = req.body;
    
    // Majburiy maydonlarni tekshirish
    if (!clientName || !clientSurname || !phone || !assignedTo || !personType) {
      return res.status(400).json({ 
        message: 'Majburiy maydonlar to'ldirilmagan', 
        fields: { clientName, clientSurname, phone, assignedTo, personType } 
      });
    }

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
    const populatedJob = await populateJob(Job.findById(newJob._id));
    res.status(201).json(populatedJob);
  } catch (err) {
    console.error('Yangi ish yaratishda xatolik:', err);
    res.status(500).json({ message: 'Yangi ish yaratishda server xatosi: ' + err.message });
  }
});

// PATCH /api/jobs/:id — Ishni tahrirlash
router.patch('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    // O'zgartirish uchun ruxsat tekshirish
    if (role !== 'admin' && 
        job.assignedTo?.toString() !== userId && 
        job.tekshiruvchi?.toString() !== userId && 
        job.yurist?.toString() !== userId) {
      return res.status(403).json({ message: 'Sizda bu ishni o'zgartirish uchun ruxsat yo'q' });
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
      action: `${role.charAt(0).toUpperCase() + role.slice(1)} tomonidan ma'lumotlar yangilandi`,
      status: status || job.status,
      updatedBy: userId,
      date: new Date()
    });

    await job.save();
    const updatedJob = await populateJob(Job.findById(id));
    res.json(updatedJob);
  } catch (err) {
    console.error('Ishni yangilashda xatolik:', err);
    res.status(500).json({ message: 'Serverda xatolik' });
  }
});

// DELETE /api/jobs/:id — Ishni o'chirish (faqat admin uchun)
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Faqat admin ishni o'chira oladi' });
  }

  try {
    const job = await Job.findByIdAndDelete(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }
    res.json({ message: 'Ish muvaffaqiyatli o'chirildi', jobId: id });
  } catch (err) {
    console.error('Ishni o'chirishda xatolik:', err);
    res.status(500).json({ message: 'Serverda xatolik' });
  }
});

module.exports = router;