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
  const { status, assignedTo, search } = req.query;
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
  res.json({ ok: true, router: 'jobs' });
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

// Exceldan import qilish
router.post('/import-excel', authenticate, upload.single('excelFile'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Fayl topilmadi' });
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    let success = 0, failed = 0; const errors = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const payload = {
          clientName: row.clientName || row.name || '',
          clientSurname: row.clientSurname || row.surname || '',
          phone: String(row.phone || '').trim(),
          brandName: row.brandName || '',
          personType: row.personType === 'yuridik' || row.personType === 'jismoniy' ? row.personType : undefined,
          status: row.status || 'yangi'
        };
        if (!payload.phone) throw new Error('telefon majburiy');
        const operatorUsername = row.assignedTo;
        if (operatorUsername) {
          // lazy import to avoid cycle
          const User = require('../models/User');
          const op = await User.findOne({ username: operatorUsername });
          if (op) payload.assignedTo = op._id;
        }
        await Job.create(payload);
        success++;
      } catch (e) {
        failed++;
        errors.push({ row: i + 2, error: e.message });
      }
    }
    res.json({ results: { total: rows.length, success, failed, errors } });
  } catch (err) { next(err); }
});

// Excelga export qilish
router.get('/export', authenticate, async (req, res, next) => {
  try {
    // Filterni qayta ishlatamiz
    req.url = req.url.replace('/export', '/');
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
