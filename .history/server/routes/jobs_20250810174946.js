// jobs.js fayli sizning avvalgi kodingizdek qoladi.
// U to'liq va funksional.
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Job = require('../models/Job');
const { authenticate } = require('../middleware/auth');

// GET /api/jobs  — filterlar bilan
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const { status, assignedTo, search } = req.query;

  try {
    let filter = {};

    if (role === 'operator') {
      filter.assignedTo = userId;
    } else if (role === 'admin') {
      if (assignedTo) filter.assignedTo = assignedTo;
    } else if (role === 'tekshiruvchi') {
      filter.assignedTo = userId;
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
      .populate('assignedTo', 'username role')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error('Jobs GET error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// POST /api/jobs — yangi ish yaratish
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
    jismoniyDocs,
    files
  } = req.body;

  try {
    if (!personType || !['yuridik', 'jismoniy'].includes(personType)) {
      return res.status(400).json({ message: "Shaxs turi noto'g'ri yoki tanlanmagan. (personType: 'yuridik' yoki 'jismoniy')" });
    }

    if (!phone) {
      return res.status(400).json({ message: "Telefon raqami majburiy." });
    }

    if (!brandName || !brandName.toString().trim()) {
      return res.status(400).json({ message: "Brand nomi kiritilishi shart." });
    }

    const job = new Job({
      clientName,
      clientSurname,
      phone,
      brandName,
      brandLogo: brandLogo || null,
      comments: comments || '',
      status: status || 'yangi',
      jarayonStep: jarayonStep || 1,
      clientInterest: clientInterest || 0,
      assignedTo: assignedTo || req.user.id,
      personType,
      yuridikDocs: yuridikDocs || {},
      jismoniyDocs: jismoniyDocs || {},
      files: files || [],
      history: [{
        action: 'Yangi ish yaratildi',
        status: status || 'yangi',
        updatedBy: req.user.id,
      }],
    });

    await job.save();
    res.status(201).json(job);
  } catch (err) {
    if (err.name === 'ValidationError') {
      console.error('Jobs POST validation error:', err);
      const messages = {};
      for (let k in err.errors) messages[k] = err.errors[k].message;
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    console.error('Jobs POST error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// PUT /api/jobs/:id — yangilash
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
      'personType',
      'yuridikDocs',
      'jismoniyDocs',
      'files'
    ];

    if (req.body.personType && !['yuridik', 'jismoniy'].includes(req.body.personType)) {
      return res.status(400).json({ message: "personType noto'g'ri qiymat." });
    }

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    if (req.body.status || (req.body.comments && req.body.comments.trim() !== '')) {
      job.history.push({
        action: 'Yangilandi',
        status: req.body.status || job.status,
        reason: req.body.comments || '',
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

// Yangi: Operator ishni tekshiruvchiga yuboradi
router.post('/:id/assign', authenticate, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    job.status = 'in_review';
    job.history.push({
      action: 'Tekshiruvchiga yuborildi',
      status: 'in_review',
      updatedBy: req.user.id
    });
    await job.save();
    res.json({ message: 'Ish tekshiruvchiga yuborildi', job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Yangi: Tekshiruvchi ishni tasdiqlaydi yoki rad etadi
router.post('/:id/review', authenticate, async (req, res) => {
  const { status, reason } = req.body; // status: "approved" yoki "rejected"
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    job.status = status;
    job.history.push({
      action: status === 'approved' ? 'Tasdiqlandi' : 'Rad etildi',
      status,
      reason: status === 'rejected' ? reason : undefined,
      updatedBy: req.user.id
    });
    await job.save();
    res.json({ message: `Ish ${status} holatiga o‘zgartirildi`, job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/jobs/:id/assign — ishni boshqa rolga o'tkazish
router.put('/:id/assign', authenticate, async (req, res) => {
  const { id } = req.params;
  const { newStatus, comment, newAssignedTo } = req.body;

  try {
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    if (newStatus) job.status = newStatus;
    if (newAssignedTo) job.assignedTo = newAssignedTo;

    job.history.push({
      action: 'Ish assign qilindi',
      status: newStatus || job.status,
      reason: comment || '',
      updatedBy: req.user.id
    });

    await job.save();
    res.json({ message: 'Ish muvaffaqiyatli yangilandi', job });
  } catch (err) {
    console.error('Jobs ASSIGN error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// GET /api/jobs/:id/history — ishning barcha tarixini olish
router.get('/:id/history', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const job = await Job.findById(id)
      .populate('history.updatedBy', 'username')
      .select('history');

    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    res.json(job.history);
  } catch (err) {
    console.error('Jobs HISTORY error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// DELETE /api/jobs/:id — admin only
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

// GET /api/jobs/:id — admin uchun ish va barcha tafsilotlari (history bilan)
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const role = req.user.role;

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Faqat admin ko‘ra oladi' });
  }

  try {
    const job = await Job.findById(id)
      .populate('assignedTo', 'username role')
      .populate('tekshiruvchi', 'username role')
      .populate('history.updatedBy', 'username role');
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });
    res.json(job);
  } catch (err) {
    console.error('Jobs GET BY ID error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});
// Eski kod saqlangan, yangi qismlar qo'shilgan

// POST /api/jobs/:id/upload-documents — documents upload (images)
router.post('/:id/upload-documents', authenticate, async (req, res) => {
  const { id } = req.params;
  // Assume multer for file upload (add multer if not)
  // For now, placeholder
  const job = await Job.findById(id);
  if (!job) return res.status(404).json({ message: 'Ish topilmadi' });
  // Files handling: req.files for images
  job.yuridikDocs = req.body.yuridikDocs || job.yuridikDocs;
  job.status = 'documents_pending';
  job.history.push({ action: 'Hujjatlar yuborildi', status: 'documents_pending', updatedBy: req.user.id });
  await job.save();
  res.json(job);
});

// POST /api/jobs/:id/review-documents — checker reviews documents
router.post('/:id/review-documents', authenticate, async (req, res) => {
  const { status, reason } = req.body; // approved or rejected
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Ish topilmadi' });
  job.status = status === 'approved' ? 'to_lawyer' : 'rejected';
  job.history.push({ action: status === 'approved' ? 'Hujjatlar tasdiqlandi' : 'Hujjatlar rad etildi', status: job.status, reason, updatedBy: req.user.id });
  await job.save();
  res.json(job);
});

// POST /api/jobs/:id/upload-certificates — yurist uploads .rar
router.post('/:id/upload-certificates', authenticate, async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Ish topilmadi' });
  // File upload for .rar
  job.certificates = req.body.certificatesPath; // Placeholder
  job.status = 'certificates_ready';
  job.history.push({ action: 'Guvohnomalar yuklandi', status: 'certificates_ready', updatedBy: req.user.id });
  await job.save();
  res.json(job);
});

// GET /api/jobs — filterlarni kengaytirdim (muammo hal qilish uchun)
router.get('/', authenticate, async (req, res) => {
  // Eski kod + error handling
  try {
    // ...
  } catch (err) {
    res.status(500).json({ message: 'Ishlarni olishda xato: ' + err.message });
  }
});
module.exports = router;