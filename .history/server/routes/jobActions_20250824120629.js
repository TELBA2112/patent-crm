const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// GET /api/job-actions/stats - Ishlar bo'yicha statistika
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = {
      total: await Job.countDocuments(),
      yangi: await Job.countDocuments({ status: 'yangi' }),
      bajarilmoqda: await Job.countDocuments({ status: 'bajarilmoqda' }),
      bajarildi: await Job.countDocuments({ status: 'bajarildi' }),
      brand_in_review: await Job.countDocuments({ status: 'brand_in_review' }),
      operators: await User.countDocuments({ role: 'operator' }),
      tekshiruvchilar: await User.countDocuments({ role: 'tekshiruvchi' }),
      yuristlar: await User.countDocuments({ role: 'yurist' })
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Statistikani olishda xatolik:', err);
    res.status(500).json({ message: 'Serverda xatolik', error: err.message });
  }
});

// POST /api/job-actions/:id/send-for-review — Brendni tekshiruvchiga yuborish
router.post('/:id/send-for-review', authenticate, async (req, res) => {
  const { id } = req.params;
  const { brandName } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  console.log('Brend tekshiruvga yuborish so\'rovi:', { id, brandName, userId, role });

  try {
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    if (role !== 'operator' && role !== 'admin') {
      return res.status(403).json({ message: 'Sizda brend yuborish uchun ruxsat yo\'q' });
    }

    if (role === 'operator' && job.assignedTo?.toString() !== userId) {
      return res.status(403).json({ message: 'Sizda bu ishni yuborish uchun ruxsat yo\'q' });
    }

    if (!brandName) {
      return res.status(400).json({ message: 'Brend nomi kiritilishi shart' });
    }

    const tekshiruvchi = await User.findOne({ role: 'tekshiruvchi' });
    if (!tekshiruvchi) {
      return res.status(400).json({ message: 'Tekshiruvchi topilmadi' });
    }

    job.brandName = brandName;
    job.status = 'brand_in_review';
    job.tekshiruvchi = tekshiruvchi._id;
    job.history.push({
      action: 'Brend tekshiruvchiga yuborildi',
      status: 'brand_in_review',
      updatedBy: userId,
      date: new Date()
    });

    await job.save();
    res.json({ message: 'Brend tekshiruvchiga yuborildi', job });
  } catch (err) {
    console.error('Brend yuborishda xatolik:', err);
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
});

// POST /api/job-actions/:id/review-brand — Tekshiruvchi tomonidan brend ko'rilishi
router.post('/:id/review-brand', authenticate, async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const userId = req.user.id;

  console.log('\n=== BRAND REVIEW REQUEST ===');
  console.log('Job ID:', id);
  console.log('Status:', status);
  console.log('Reason:', reason);
  console.log('User ID:', userId);

  try {
    if (req.user.role !== 'tekshiruvchi' && req.user.role !== 'admin') {
      console.log('❌ XATOLIK: Foydalanuvchi roli tekshiruvchi yoki admin emas:', req.user.role);
      return res.status(403).json({ message: 'Faqat tekshiruvchilar brend ko\'rishi mumkin' });
    }

    const job = await Job.findById(id);
    if (!job) {
      console.log('❌ XATOLIK: Ish topilmadi ID:', id);
      return res.status(404).json({ message: 'Ish topilmadi' });
    }

    // Admin uchun tekshirish shartini o'zgartirish
    if (req.user.role !== 'admin' && job.tekshiruvchi?.toString() !== userId) {
      console.log('❌ XATOLIK: Ruxsat yo\'q. Tekshiruvchi ID:', job.tekshiruvchi, 'User ID:', userId);
      return res.status(403).json({ message: 'Bu ishni ko\'rishga ruxsatingiz yo\'q' });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      console.log('❌ XATOLIK: Noto\'g\'ri status:', status);
      return res.status(400).json({ message: 'Status noto\'g\'ri: approved yoki rejected bo\'lishi kerak' });
    }

    if (status === 'rejected' && !reason) {
      console.log('❌ XATOLIK: Rad etish sababi ko\'rsatilmagan');
      return res.status(400).json({ message: 'Rad etish sababini ko\'rsatish shart' });
    }

    console.log('✅ Barcha tekshirishlar o\'tdi, ish yangilanmoqda...');
    
    job.status = status;
    job.comments = reason || '';
    job.history.push({
      action: `Brend ${status === 'approved' ? 'tasdiqlandi' : 'rad etildi'}`,
      status,
      reason: reason || '',
      updatedBy: userId,
      date: new Date()
    });

    await job.save();
    console.log('✅ Ish muvaffaqiyatli yangilandi');
    
    res.json({ 
      message: `Brend ${status === 'approved' ? 'tasdiqlandi' : 'rad etildi'}`, 
      job 
    });
  } catch (err) {
    console.error('❌ SERVER XATOLIGI:', err);
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
});

module.exports = router;