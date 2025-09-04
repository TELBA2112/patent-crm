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

// ... boshqa routelar

// PUT /api/jobs/:id — Ishni yangilash (brendni tekshiruvchiga yuborish)
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { brandName, action } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  console.log('So‘rov keldi:', { id, brandName, action, userId, role });

  try {
    const job = await Job.findById(id);
    if (!job) {
      console.log('Ish topilmadi:', id);
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    if (role !== 'operator' && role !== 'admin') {
      console.log('Ruxsat yo‘q:', { userId, role });
      return res.status(403).json({ message: 'Sizda bu ishni yangilash uchun ruxsat yo‘q' });
    }

    if (role === 'operator' && job.assignedTo?.toString() !== userId) {
      console.log('Operator uchun ruxsat yo‘q:', { userId, assignedTo: job.assignedTo });
      return res.status(403).json({ message: 'Sizda bu ishni yangilash uchun ruxsat yo‘q' });
    }

    if (action === 'send-for-review') {
      if (!brandName) {
        console.log('BrandName bo‘sh');
        return res.status(400).json({ message: 'Brend nomi kiritilmagan' });
      }

      const tekshiruvchi = await User.findOne({ role: 'tekshiruvchi' });
      if (!tekshiruvchi) {
        console.log('Tekshiruvchi topilmadi');
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
    } else {
      return res.status(400).json({ message: 'Noto‘g‘ri harakat turi' });
    }

    await job.save();
    console.log('Ish yangilandi:', { id, status: job.status });
    res.json({ message: 'Ish muvaffaqiyatli yangilandi', job });
  } catch (err) {
    console.error('Ish yangilashda xatolik:', err);
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
});

module.exports = router;