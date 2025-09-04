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
router.post('/:id/send-for-review', async (req, res) => {
  res.json({ msg: "send-for-review route ishladi!", jobId: req.params.id });

  try {
    const jobId = req.params.id;
    console.log("Kelgan jobId:", jobId);   // 🔍 log
    const { brandName } = req.body;
    console.log("Kelgan brandName:", brandName); // 🔍 log

    const job = await Job.findById(jobId);
    console.log("Topilgan job:", job); // 🔍 log

    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    job.brandName = brandName;
    job.status = 'review';
    await job.save();

    res.json({ message: 'Brend tekshiruvchiga yuborildi', job });
  } catch (err) {
    console.error('send-for-review error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

router.get('/__ping', (req, res) => res.json({ ok: true, msg: 'jobs router ishlayapti' }));
router.post('/test', (req,res) => {
  res.json({ msg: "test ishladi" });
});

module.exports = router;
