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
  console.log('GET /api/jobs so\'rovi qabul qilindi');
  console.log('Foydalanuvchi:', req.user?.username, '(', req.user?.role, ')');
  console.log('So\'rov parametrlari:', req.query);
  
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { status, assignedTo, search } = req.query;

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
      return res.status(403).json({ message: 'Ruxsat yo`q' });
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

    console.log('MongoDB filter:', filter);
    // Barcha ishlarni olish
    const jobs = await Job.find(filter);
    console.log(`${jobs.length} ta ish topildi`);
    
    // Population bajarish
    const populatedJobs = await populateJob(Job.find(filter));
    res.json(populatedJobs);
  } catch (err) {
    console.error('Ishlarni olishda xatolik:', err);
    res.status(500).json({ message: 'Serverda xatolik: ' + err.message });
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

// POST /api/jobs — Yangi ish yaratish
router.post('/', authenticate, async (req, res) => {
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
    console.log('MUVAFFAQIYAT: Yangi ish yaratildi. ID:', newJob._id);
    
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

module.exports = router;