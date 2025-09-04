const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// Ishlarni to‘ldirish uchun yordamchi funksiya
const populateJob = (query) => {
  return query
    .populate('assignedTo', 'username role')
    .populate('tekshiruvchi', 'username')
    .populate('yurist', 'username')
    .populate('history.updatedBy', 'username');
};

// GET /api/jobs — ishlarni olish
router.get('/', authenticate, async (req, res) => {
  try {
    const jobs = await populateJob(Job.find());
    res.json(jobs);
  } catch (err) {
    console.error('Ishlarni olishda xatolik:', err);
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
});

// POST /api/jobs — yangi ish yaratish
router.post('/', authenticate, async (req, res) => {
  const { brandName, assignedTo } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    // Faqat operator yoki admin yangi ish yaratishi mumkin
    if (role !== 'operator' && role !== 'admin') {
      return res.status(403).json({ message: 'Yangi ish yaratish uchun ruxsat yo‘q' });
    }

    if (!brandName || !brandName.trim()) {
      return res.status(400).json({ message: 'Brend nomi kiritilishi shart' });
    }

    // Operator faqat o'ziga ish yaratishi mumkin
    if (role === 'operator' && assignedTo && assignedTo !== userId) {
      return res.status(403).json({ message: 'Operator faqat o‘ziga ish yaratishi mumkin' });
    }

    const jobData = {
      brandName: brandName.trim(),
      status: 'created',
      assignedTo: assignedTo || userId,
      history: [{
        action: 'Ish yaratildi',
        status: 'created',
        updatedBy: userId,
        date: new Date()
      }]
    };

    const newJob = new Job(jobData);
    await newJob.save();

    const populatedJob = await populateJob(Job.findById(newJob._id));

    res.status(201).json(populatedJob);
  } catch (err) {
    console.error('Yangi ish yaratishda xatolik:', err);
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
});

// PATCH /api/jobs/:id/send-for-review — Brendni tekshiruvchiga yuborish
router.patch('/:id/send-for-review', authenticate, async (req, res) => {
  const { id } = req.params;
  const { brandName } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  console.log('So‘rov keldi:', { id, brandName, userId, role }); // Debug log

  try {
    // Ishni topish
    const job = await Job.findById(id);
    if (!job) {
      console.log('Ish topilmadi:', id);
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    // Faqat operator yoki admin yuborishi mumkin
    if (role !== 'operator' && role !== 'admin') {
      console.log('Ruxsat yo‘q:', { userId, role });
      return res.status(403).json({ message: 'Sizda brend yuborish uchun ruxsat yo‘q' });
    }

    // Ish operatorga tegishli ekanligini tekshirish
    if (role === 'operator' && job.assignedTo?.toString() !== userId) {
      console.log('Operator uchun ruxsat yo‘q:', { userId, assignedTo: job.assignedTo });
      return res.status(403).json({ message: 'Sizda bu ishni yuborish uchun ruxsat yo‘q' });
    }

    // BrandName mavjudligini tekshirish
    if (!brandName) {
      console.log('BrandName bo‘sh');
      return res.status(400).json({ message: 'Brend nomi kiritilmagan' });
    }

    // Tekshiruvchi topish
    const tekshiruvchi = await User.findOne({ role: 'tekshiruvchi' });
    if (!tekshiruvchi) {
      console.log('Tekshiruvchi topilmadi');
      return res.status(400).json({ message: 'Tekshiruvchi topilmadi' });
    }

    // Ishni yangilash
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
    console.log('Ish yangilandi:', { id, status: job.status, tekshiruvchi: tekshiruvchi._id });
    res.json({ message: 'Brend tekshiruvchiga yuborildi', job });
  } catch (err) {
    console.error('Brend yuborishda xatolik:', err);
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
});

module.exports = router;
