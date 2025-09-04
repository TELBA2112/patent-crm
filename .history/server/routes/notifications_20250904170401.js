const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = mongoose.model('Notification');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure file upload with multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/notifications');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedFileTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Faqat PDF, Word, Excel va rasmlar (.jpg, .jpeg, .png) qabul qilinadi'));
    }
  }
});

// GET /api/notifications - list my notifications (by user id or my role)
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = { $or: [{ user: req.user.id }, { role: req.user.role }] };
    const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Bildirishnomalarni olishda xatolik', error: err.message });
  }
});

// PUT /api/notifications/:id/read - mark as read (authorize by user/role)
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const n = await Notification.findById(id);
    if (!n) return res.status(404).json({ message: 'Topilmadi' });
    if (n.user && String(n.user) !== String(req.user.id) && n.role !== req.user.role) {
      return res.status(403).json({ message: 'Ruxsat yo\'q' });
    }
    n.read = true;
    await n.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Yangilashda xatolik', error: err.message });
  }
});

// POST /api/notifications - create manual notification (auth required)
router.post('/', authenticate, async (req, res) => {
  try {
    const { user, role, job, type, title, message, link } = req.body || {};
    const payload = { user, role, job, type, title, message, link };
    const n = await Notification.create(payload);
    res.status(201).json(n);
  } catch (err) {
    res.status(500).json({ message: 'Yaratishda xatolik', error: err.message });
  }
});

module.exports = router;

