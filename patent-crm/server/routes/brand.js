const express = require('express');
const router = express.Router();
const BrandRequest = require('../models/BrandRequest');
const authMiddleware = require('../middleware/authMiddleware'); // sizning autentifikatsiya middleware

// POST /submit-docs/:id  -- operator tomonidan hujjatlarni yuborish uchun (misol uchun)
router.post('/submit-docs/:id', authMiddleware, async (req, res) => {
  const { docType, documents } = req.body;
  try {
    const request = await BrandRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Faqat operator hujjatlarni yuborishi mumkin
    if (req.user.role !== 'operator') {
      return res.status(403).json({ message: 'Only operators allowed' });
    }

    request.docType = docType;
    request.documents = documents;
    request.status = 'docs_submitted';

    await request.save();
    res.json({ message: 'Documents submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// POST /review-docs/:id  -- tekshirish (checker uchun)
router.post('/review-docs/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'checker') return res.status(403).json({ message: 'Only checkers allowed' });

  const { action, comment, fileUrl } = req.body;
  try {
    const request = await BrandRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Not found' });

    if (request.status !== 'docs_submitted') {
      return res.status(400).json({ message: 'No docs to review' });
    }

    if (action === 'reject') {
      request.status = 'checked'; // qaytib operatorga beradi
      request.documentReview = { comment, fileUrl };
    } else if (action === 'approve') {
      request.status = 'sent_to_lawyer';
      request.documentReview = {};
    }

    await request.save();
    res.json({ message: 'Review updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
