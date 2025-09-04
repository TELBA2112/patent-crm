const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Modelni to'g'ridan-to'g'ri import qilish, ro'yxatdan o'tmagan schema xatolarini oldini oladi
const Job = require('../models/Job');

// GET /api/jobs
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      // Bir nechta statuslar vergul bilan kelishi mumkin
      const statuses = String(status)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (statuses.length > 1) {
        filter.status = { $in: statuses };
      } else if (statuses.length === 1) {
        filter.status = statuses[0];
      }
    }
  const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

// PUT /api/jobs/:id/mktu-classes - MKTU sinflarini yangilash
router.put('/:id/mktu-classes', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });

    let { classes } = req.body;
    if (!Array.isArray(classes)) classes = [];

    // Sinflarni raqamga o'girish va noyob qilish
    const normalized = [...new Set(classes.map(c => parseInt(c)).filter(n => !isNaN(n)))];

    const job = await Job.findByIdAndUpdate(
      id,
      { $set: { classes: normalized } },
      { new: true, runValidators: true }
    );
    if (!job) return res.status(404).json({ message: 'Topilmadi' });
    res.json({ success: true, classes: job.classes || [] });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Topilmadi' });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs
router.post('/', async (req, res, next) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

// PUT /api/jobs/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
    const job = await Job.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ message: 'Topilmadi' });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
    const job = await Job.findByIdAndDelete(id);
    if (!job) return res.status(404).json({ message: 'Topilmadi' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
