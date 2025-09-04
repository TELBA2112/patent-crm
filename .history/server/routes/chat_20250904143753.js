const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const Message = require('../models/Message');
const Job = require('../models/Job');

// List messages for a job (paginated)
router.get('/jobs/:jobId/messages', authenticate, async (req, res) => {
	try {
		const { jobId } = req.params;
		if (!mongoose.isValidObjectId(jobId)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
		const page = Math.max(parseInt(req.query.page || '1'), 1);
		const limit = Math.min(Math.max(parseInt(req.query.limit || '50'), 1), 200);

		const [items, total] = await Promise.all([
			Message.find({ job: jobId }).sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit).populate('sender', 'username role firstName lastName'),
			Message.countDocuments({ job: jobId }),
		]);
		res.json({ items, total, page, limit });
	} catch (err) {
		console.error('Chat messages olishda xatolik:', err);
		res.status(500).json({ message: 'Server xatosi', error: err.message });
	}
});

// Send message with optional attachments
router.post('/jobs/:jobId/messages', authenticate, upload.uploadAny.array('files', 5), async (req, res) => {
	try {
		const { jobId } = req.params;
		if (!mongoose.isValidObjectId(jobId)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
		const job = await Job.findById(jobId);
		if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

		const attachments = (req.files || []).map((f) => ({ path: f.path, originalName: f.originalname, mimeType: f.mimetype, size: f.size }));
		const msg = await Message.create({ job: jobId, sender: req.user.id, toRole: req.body.toRole, text: req.body.text || '', attachments });
		const populated = await msg.populate('sender', 'username role firstName lastName');
		res.status(201).json(populated);
	} catch (err) {
		console.error('Chat message yuborishda xatolik:', err);
		res.status(500).json({ message: 'Server xatosi', error: err.message });
	}
});

// Replace a file in a message (for corrections)
router.post('/jobs/:jobId/messages/:messageId/replace', authenticate, upload.uploadAny.single('file'), async (req, res) => {
	try {
		const { jobId, messageId } = req.params;
		if (!mongoose.isValidObjectId(jobId) || !mongoose.isValidObjectId(messageId)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
		const prev = await Message.findOne({ _id: messageId, job: jobId });
		if (!prev) return res.status(404).json({ message: 'Xabar topilmadi' });
		if (!req.file) return res.status(400).json({ message: 'Fayl kiritilmadi' });

		const newMsg = await Message.create({
			job: jobId,
			sender: req.user.id,
			text: req.body.text || `Fayl almashtirildi: ${req.file.originalname}`,
			attachments: [{ path: req.file.path, originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size }],
			replacesMessageId: prev._id,
		});
		const populated = await newMsg.populate('sender', 'username role firstName lastName');
		res.status(201).json(populated);
	} catch (err) {
		console.error('Fayl almashtirishda xatolik:', err);
		res.status(500).json({ message: 'Server xatosi', error: err.message });
	}
});

module.exports = router;

// --- Compatibility aliases ---
// Some clients call /api/chat/:jobId directly
router.get('/:jobId', authenticate, async (req, res) => {
	// Delegate to listing with defaults
	req.params = req.params || {};
	req.query = req.query || {};
	try {
		const { jobId } = req.params;
		if (!mongoose.isValidObjectId(jobId)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
		const page = Math.max(parseInt(req.query.page || '1'), 1);
		const limit = Math.min(Math.max(parseInt(req.query.limit || '50'), 1), 200);
		const [items, total] = await Promise.all([
			Message.find({ job: jobId }).sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit).populate('sender', 'username role firstName lastName'),
			Message.countDocuments({ job: jobId }),
		]);
		res.json({ items, total, page, limit });
	} catch (err) {
		console.error('Chat alias GET da xatolik:', err);
		res.status(500).json({ message: 'Server xatosi', error: err.message });
	}
});

router.post('/:jobId', authenticate, upload.uploadAny.array('files', 5), async (req, res) => {
	try {
		const { jobId } = req.params;
		if (!mongoose.isValidObjectId(jobId)) return res.status(400).json({ message: 'Noto‘g‘ri ID' });
		const job = await Job.findById(jobId);
		if (!job) return res.status(404).json({ message: 'Ish topilmadi' });
		const attachments = (req.files || []).map((f) => ({ path: f.path, originalName: f.originalname, mimeType: f.mimetype, size: f.size }));
		const msg = await Message.create({ job: jobId, sender: req.user.id, toRole: req.body.toRole, text: req.body.text || '', attachments });
		const populated = await msg.populate('sender', 'username role firstName lastName');
		res.status(201).json(populated);
	} catch (err) {
		console.error('Chat alias POST da xatolik:', err);
		res.status(500).json({ message: 'Server xatosi', error: err.message });
	}
});

