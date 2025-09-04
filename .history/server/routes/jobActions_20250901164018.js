const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Job = require('../models/Job');
const User = require('../models/User');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Simple test route to verify the router is working
router.get('/test', (req, res) => {
  res.json({ message: 'JobActions router is working!' });
});

// GET /api/job-actions/stats - Ishlar bo'yicha statistika
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = {
      total: await Job.countDocuments(),
      yangi: await Job.countDocuments({ status: 'yangi' }),
      bajarilmoqda: await Job.countDocuments({ status: 'bajarilmoqda' }),
      bajarildi: await Job.countDocuments({ status: 'bajarildi' }),
      brand_in_review: await Job.countDocuments({ status: 'brand_in_review' }),
      operators: await User.countDocuments({ role: 'operator' }),
      tekshiruvchilar: await User.countDocuments({ role: 'tekshiruvchi' }),
      yuristlar: await User.countDocuments({ role: 'yurist' })
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Statistikani olishda xatolik:', err);
    res.status(500).json({ message: 'Serverda xatolik', error: err.message });
  }
});

// POST /api/job-actions/:id/update-mktu-classes — MKTU sinflarini yangilash
router.post('/:id/update-mktu-classes', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { classes } = req.body;
    const userId = req.user.id;

    console.log('MKTU sinflari yangilanmoqda:', { jobId: id, classes, userId });
    
    // Validate classes
    if (!classes || !Array.isArray(classes)) {
      return res.status(400).json({ message: 'MKTU sinflari massiv formatida bo\'lishi kerak' });
    }
    
    // Normalize classes to integers
    const normalizedClasses = classes
      .map(cls => parseInt(cls))
      .filter(cls => !isNaN(cls) && cls >= 1 && cls <= 45);
    
    if (normalizedClasses.length === 0) {
      return res.status(400).json({ message: 'Kamida bitta to\'g\'ri MKTU sinfi bo\'lishi kerak' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    // Update the job with normalized classes
    job.classes = normalizedClasses;
    
    // Add to history
    job.history.push({
      action: 'MKTU sinflari yangilandi',
      updatedBy: userId,
      date: new Date()
    });

    await job.save();
    
    console.log('MKTU sinflari muvaffaqiyatli yangilandi:', normalizedClasses);
    res.json({ 
      message: 'MKTU sinflari muvaffaqiyatli yangilandi', 
      classes: normalizedClasses 
    });
  } catch (err) {
    console.error('MKTU sinflarini yangilashda xatolik:', err);
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
});

// Add other routes from jobActions.js as needed, one by one to identify any issues

module.exports = router;