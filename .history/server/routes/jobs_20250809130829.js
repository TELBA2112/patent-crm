const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Job = require('../models/Job');
const { authenticate } = require('../middleware/auth');

// Operator uchun o'z ishlarini olish, filterlar bilan
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const { status, assignedTo, search } = req.query;

  try {
    let filter = {};

    if (role === 'operator') {
      // Operator faqat o'z ishlarini ko'radi
      filter.assignedTo = userId;
    } else if (role === 'admin') {
      // Admin hamma ishlarni ko'radi
      if (assignedTo) filter.assignedTo = assignedTo;
    } else {
      return res.status(403).json({ message: 'Ruxsat yo‘q' });
    }

    if (status) filter.status = status;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ phone: regex }];

      if (mongoose.Types.ObjectId.isValid(search)) {
        filter.$or.push({ _id: search });
      }
    }

    const jobs = await Job.find(filter)
      .populate('assignedTo', 'username')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error('Jobs GET error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// Yangi ish yaratish
router.post('/', authenticate, async (req, res) => {
  const role = req.user.role;
  if (role !== 'operator' && role !== 'admin') {
    return res.status(403).json({ message: 'Faqat operator yoki admin yangi ish qo‘shishi mumkin' });
  }

  const {
    clientName,
    clientSurname,
    phone,
    brandName,
    brandLogo,
    comments,
    status,
    jarayonStep,
    clientInterest,
    assignedTo,
    personType,
    yuridikDocs,
    jismoniyDocs
  } = req.body;

  try {
    const job = new Job({
      clientName,
      clientSurname,
      phone,
      brandName,
      brandLogo,
      comments,
      status: status || 'yangi',
      jarayonStep: jarayonStep || 1,
      clientInterest: clientInterest || 0,
      assignedTo: assignedTo || req.user.id,
      personType: personType || '',
      yuridikDocs: yuridikDocs || {},
      jismoniyDocs: jismoniyDocs || {},
      history: [{
        status: status || 'yangi',
        comment: 'Yangi ish yaratildi',
        updatedBy: req.user.id,
      }],
    });

    await job.save();
    res.status(201).json(job);
  } catch (err) {
    console.error('Jobs POST error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// Ishni yangilash
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const role = req.user.role;

  try {
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    if ((!job.assignedTo || job.assignedTo.toString() !== req.user.id) && role !== 'admin') {
      return res.status(403).json({ message: 'Yangilash uchun ruxsat yo‘q' });
    }

    const allowedUpdates = [
      'clientName',
      'clientSurname',
      'phone',
      'brandName',
      'brandLogo',
      'comments',
      'status',
      'jarayonStep',
      'clientInterest',
      'assignedTo',
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    if (req.body.status || (req.body.comments && req.body.comments.trim() !== '')) {
      job.history.push({
        status: req.body.status || job.status,
        comment: req.body.comments || '',
        updatedBy: req.user.id,
      });
    }

    await job.save();
    res.json(job);
  } catch (err) {
    console.error('Jobs PUT error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// Ishni o'chirish - faqat admin
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const role = req.user.role;

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Faqat admin o‘chira oladi' });
  }

  try {
    const job = await Job.findByIdAndDelete(id);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    res.json({ message: 'Ish muvaffaqiyatli o‘chirildi' });
  } catch (err) {
    console.error('Jobs DELETE error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

module.exports = router;
