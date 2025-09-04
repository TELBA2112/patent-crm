const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Modelni to'g'ridan-to'g'ri import qilish, ro'yxatdan o'tmagan schema xatolarini oldini oladi
const Job = require('../models/Job');

// GET /api/jobs
// GET /api/jobs (qo'shimcha: bir nechta statuslarni vergul bilan qabul qiladi)
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      if (status.includes(',')) {
        const list = status.split(',').map(s => s.trim()).filter(Boolean);
        filter.status = { $in: list };
      } else {
        filter.status = status;
      }
    }
    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
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

// PUT /api/jobs/:id (status va boshqa maydonlarni yangilash)
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
    const update = req.body || {};
    const job = await Job.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ message: 'Topilmadi' });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

// PUT /api/jobs/:id/mktu-classes (MKTU sinflarini saqlash)
router.put('/:id/mktu-classes', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { classes } = req.body;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
    if (!Array.isArray(classes)) return res.status(400).json({ message: 'classes massiv bo‘lishi kerak' });
    const normalized = classes.map(c => parseInt(c)).filter(c => !isNaN(c));
    const job = await Job.findByIdAndUpdate(id, { classes: normalized }, { new: true });
    if (!job) return res.status(404).json({ message: 'Topilmadi' });
    res.json({ success: true, classes: job.classes });
  } catch (err) {
    next(err);
  }
});

// Power of attorney uchun stublar (frontend bilan mos)
router.post('/:id/power-of-attorney', async (req, res, next) => {
  try {
    // Hozircha faqat OK qaytaramiz; real saqlash keyin qo‘shiladi
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/power-of-attorney-pdf', async (req, res, next) => {
  try {
    // Hozircha bo‘sh PDF o‘rniga JSON qaytaramiz; frontend blob qabul qiladi
    res.setHeader('Content-Type', 'application/pdf');
    res.status(200).send(Buffer.from('%PDF-1.4\n% Stub PDF\n', 'utf-8'));
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
