// routes/jobs.js
const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const auth = require('../middleware/auth');

// POST /api/jobs/:id/send-for-review
router.post('/:id/send-for-review', auth, async (req, res) => {
  try {
    const { brandName } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    // statusni yangilaymiz
    job.status = 'tekshiruvda';
    job.brandName = brandName || job.brandName;

    job.history.push({
      status: 'tekshiruvda',
      comment: `Brend "${job.brandName}" tekshiruvchiga yuborildi`,
      updatedBy: req.user.id,
      date: new Date()
    });

    await job.save();

    res.json({ message: 'Ish tekshiruvchiga yuborildi', job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

module.exports = router;
