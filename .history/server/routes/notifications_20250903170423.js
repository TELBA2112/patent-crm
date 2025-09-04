const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = mongoose.model('Notification');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications - list my notifications (by user id or my role)
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {
      $or: [
        { user: req.user.id },
        { role: req.user.role },
      ],
    };
    const items = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Bildirishnomalarni olishda xatolik', error: err.message });
  }
});

// PUT /api/notifications/:id/read - mark as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const n = await Notification.findById(id);
    if (!n) return res.status(404).json({ message: 'Topilmadi' });
    n.read = true;
    await n.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Yangilashda xatolik', error: err.message });
  }
});

// POST /api/notifications - create manual notification (admin only in future, for now allow authenticated)
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
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Notification = require('../models/Notification');

// List current user's notifications (by user id or role)
router.get('/', authenticate, async (req, res) => {
	try {
		const filter = { $or: [{ user: req.user.id }, { role: req.user.role }] };
		const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(200);
		res.json(items);
	} catch (err) {
		res.status(500).json({ message: 'Server xatosi', error: err.message });
	}
});

// Mark notification as read
router.post('/:id/read', authenticate, async (req, res) => {
	try {
		const { id } = req.params;
		const n = await Notification.findById(id);
		if (!n) return res.status(404).json({ message: 'Topilmadi' });
		// Allow if addressed to user or their role
		if (String(n.user) !== String(req.user.id) && n.role !== req.user.role) {
			return res.status(403).json({ message: 'Ruxsat yo‘q' });
		}
		n.read = true;
		await n.save();
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ message: 'Server xatosi', error: err.message });
	}
});

module.exports = router;

