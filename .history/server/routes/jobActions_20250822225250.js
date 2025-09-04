const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// POST /api/job-actions/:id/send-for-review — Brendni tekshiruvchiga yuborish
router.post('/:id/send-for-review', authenticate, async (req, res) => {
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