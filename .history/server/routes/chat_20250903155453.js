const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');
const Message = mongoose.model('Message');
const Job = mongoose.model('Job');
const { uploadAny } = require('../middleware/upload');

// List messages for a job
router.get('/:jobId', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!mongoose.isValidObjectId(jobId)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
    const messages = await Message.find({ job: jobId }).sort({ createdAt: 1 }).populate('from', 'username role firstName lastName');
    res.json(messages);
  } catch (err) {
    console.error('Chat list error:', err);
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Send message (optional file)
router.post('/:jobId', authenticate, uploadAny.single('file'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { text, toRole } = req.body;
    if (!mongoose.isValidObjectId(jobId)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

    const msg = new Message({
      job: jobId,
      from: req.user.id,
      toRole: toRole || 'tekshiruvchi',
      text: text || ''
    });
    if (req.file) {
      msg.file = {
        path: req.file.path,
        name: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      };
    }
    await msg.save();
    res.status(201).json(msg);
  } catch (err) {
    console.error('Chat send error:', err);
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

module.exports = router;
