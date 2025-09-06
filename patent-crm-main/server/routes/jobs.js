const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
console.log('🧭 jobs router module yuklandi');

// Router darajasida har bir so'rovni log qilish
router.use((req, res, next) => {
  console.log(`🧭 [jobs] ${req.method} ${req.originalUrl}`);
  next();
});

// Modelni to'g'ridan-to'g'ri import qilish, ro'yxatdan o'tmagan schema xatolarini oldini oladi
const Job = require('../models/Job');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const xlsx = require('xlsx');
const stream = require('stream');
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/jobs
router.get('/', async (req, res, next) => {
  try {
  const { status, assignedTo, search, archived } = req.query;
  const filter = {};
    if (typeof archived !== 'undefined') {
      filter.archived = String(archived) === 'true';
    }
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
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
    if (search) {
      // Qidiruv: mijoz ismi, familiyasi, telefon yoki brend nomi bo'yicha
      const s = String(search).trim();
      if (s) {
        filter.$or = [
          { clientName: { $regex: s, $options: 'i' } },
          { clientSurname: { $regex: s, $options: 'i' } },
          { phone: { $regex: s, $options: 'i' } },
          { brandName: { $regex: s, $options: 'i' } },
        ];
      }
    }

    const jobs = await Job.find(filter)
      .populate('assignedTo', 'firstName lastName username role')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

// Health check for this router
router.get('/ping', (req, res) => {
  const list = [];
  try {
    router.stack.forEach((l) => {
      if (l.route && l.route.path) {
        list.push(l.route.path);
      }
    });
  } catch (e) {}
  res.json({ ok: true, router: 'jobs', routes: list });
});

// Debug: list routes inside this router
router.get('/debug/routes', (req, res) => {
  try {
    const list = [];
    router.stack.forEach((l) => {
      if (l.route && l.route.path) {
        const methods = Object.keys(l.route.methods).map(m => m.toUpperCase());
        list.push({ methods, path: l.route.path });
      }
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Tekshiruvchi: tugallangan ishlar (lawyer_completed, finished, finalized)
router.get('/views/tekshiruvchi-completed', async (req, res, next) => {
  try {
    const Job = require('../models/Job');
    const jobs = await Job.find({ status: { $in: ['lawyer_completed', 'finished', 'finalized'] }, archived: { $ne: true } })
      .sort({ updatedAt: -1 });
    res.json(jobs);
  } catch (err) { next(err); }
});

// Alias: /views/tekshiruvchi/completed
router.get('/views/tekshiruvchi/completed', async (req, res, next) => {
  try {
    const Job = require('../models/Job');
    const jobs = await Job.find({ status: { $in: ['lawyer_completed', 'finished', 'finalized'] }, archived: { $ne: true } })
      .sort({ updatedAt: -1 });
    res.json(jobs);
  } catch (err) { next(err); }
});

// Lawyer views: new, in-progress, completed
router.get('/views/lawyer/new', async (req, res, next) => {
  try {
    const Job = require('../models/Job');
    const jobs = await Job.find({ status: { $in: ['to_lawyer'] }, archived: { $ne: true } }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) { next(err); }
});

router.get('/views/lawyer/in-progress', async (req, res, next) => {
  try {
    const Job = require('../models/Job');
    const jobs = await Job.find({ status: { $in: ['lawyer_processing'] }, archived: { $ne: true } }).sort({ updatedAt: -1 });
    res.json(jobs);
  } catch (err) { next(err); }
});

router.get('/views/lawyer/completed', async (req, res, next) => {
  try {
    const Job = require('../models/Job');
    const jobs = await Job.find({ status: { $in: ['lawyer_completed', 'finished', 'finalized'] }, archived: { $ne: true } }).sort({ updatedAt: -1 });
    res.json(jobs);
  } catch (err) { next(err); }
});

// Operator: yangi ishlar
router.get('/views/operator-new', async (req, res, next) => {
  try {
    const Job = require('../models/Job');
  const jobs = await Job.find({ status: { $in: ['yangi', 'returned_to_operator', 'documents_returned', 'lawyer_completed'] }, archived: { $ne: true } })
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) { next(err); }
});

router.get('/views/ping', (req, res) => {
  res.json({ ok: true, note: 'views are reachable' });
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

// Export before :id
router.get('/export', authenticate, async (req, res, next) => {
  try {
    const { status, assignedTo, search } = req.query;
    const filter = {};
    if (status) {
      const statuses = String(status).split(',').map(s=>s.trim()).filter(Boolean);
      if (statuses.length > 1) filter.status = { $in: statuses }; else if (statuses.length===1) filter.status = statuses[0];
    }
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      const s = String(search).trim();
      if (s) filter.$or = [
        { clientName: { $regex: s, $options: 'i' } },
        { clientSurname: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { brandName: { $regex: s, $options: 'i' } },
      ];
    }
    const jobs = await Job.find(filter).populate('assignedTo', 'username firstName lastName').sort({ createdAt: -1 });
    const rows = jobs.map(j => ({
      clientName: j.clientName || '',
      clientSurname: j.clientSurname || '',
      phone: j.phone || '',
      brandName: j.brandName || '',
      personType: j.personType || '',
      assignedTo: j.assignedTo?.username || '',
      status: j.status || ''
    }));
    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Jobs');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="jobs_export.xlsx"');
    res.send(buf);
  } catch (err) { next(err); }
});

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

// POST /api/jobs/:id/archive - mark job as archived
router.post('/:id/archive', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Topilmadi' });
    job.archived = true;
    job.archivedAt = new Date();
    await job.save();
    res.json({ success: true, archivedAt: job.archivedAt });
  } catch (err) { next(err); }
});

// GET /api/jobs/archived - list archived jobs
router.get('/list/archived', async (req, res, next) => {
  try {
    const jobs = await Job.find({ archived: true }).sort({ archivedAt: -1 });
    res.json(jobs);
  } catch (err) { next(err); }
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
