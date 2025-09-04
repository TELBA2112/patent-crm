const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');
const Notification = mongoose.model('Notification');

// List my notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const list = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100);
    res.json(list);
  } catch (err) {
    console.error('Notif list error:', err);
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Mark as read
router.post('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
    const n = await Notification.findOneAndUpdate({ _id: id, user: req.user.id }, { read: true }, { new: true });
    if (!n) return res.status(404).json({ message: 'Topilmadi' });
    res.json(n);
  } catch (err) {
    console.error('Notif read error:', err);
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

module.exports = router;
