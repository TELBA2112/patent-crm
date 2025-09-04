const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// Yangi ish yaratish
router.post('/', authenticate, async (req, res) => {
  try {
    const { clientName, phone } = req.body;
    const job = new Job({
      clientName,
      phone,
      assignedTo: req.user.id,
      status: 'yangi',
      history: [{ action: 'Ish yaratildi', status: 'yangi', updatedBy: req.user.id }]
    });
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Xatolik: ' + err.message });
  }
});

// Barcha ishlarni olish
router.get('/', authenticate, async (req, res) => {
  try {
    const jobs = await Job.find({ assignedTo: req.user.id });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Xatolik: ' + err.message });
  }
});

// Tekshiruvchiga yuborish
router.post('/:id/send-for-review', authenticate, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Topilmadi' });

    const tekshiruvchi = await User.findOne({ role: 'tekshiruvchi' });
    if (!tekshiruvchi) return res.status(400).json({ message: 'Tekshiruvchi yo‘q' });

    job.status = 'brand_in_review';
    job.tekshiruvchi = tekshiruvchi._id;
    job.brandName = req.body.brandName;
    job.history.push({
      action: 'Brend tekshiruvchiga yuborildi',
      status: job.status,
      updatedBy: req.user.id
    });

    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Xatolik: ' + err.message });
  }
});
router.get('/__ping', (req, res) => res.json({ ok: true, msg: 'jobs router ishlayapti' }));

module.exports = router;
