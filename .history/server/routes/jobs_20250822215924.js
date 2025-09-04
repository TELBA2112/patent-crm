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
router.post('/:id/send-for-review', (req, res) => {
  res.json({ ok: true, msg: "send-for-review router ishladi ✅", jobId: req.params.id });
});


router.get('/__ping', (req, res) => res.json({ ok: true, msg: 'jobs router ishlayapti' }));
router.post('/test', (req,res) => {
  res.json({ msg: "test ishladi" });
});

module.exports = router;
