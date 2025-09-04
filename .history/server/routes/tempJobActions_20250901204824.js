/**
 * Vaqtinchalik job-actions routerlari - asosiy router ishlashida muammo bo'lsa ishlaydi
 */

module.exports = function(app) {
  const mongoose = require('mongoose');
  const Job = mongoose.model('Job');
  const auth = require('../middleware/auth');

  // Brendni tekshiruvchiga yuborish
  app.post('/api/job-actions/:jobId/send-for-review', auth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const { brandName } = req.body;
      if (!brandName) return res.status(400).json({ message: 'Brend nomi kiritilmagan' });

      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

      job.brandName = brandName;
      // job.classes = [] // olib tashlandi
      job.status = 'brand_in_review';
      job.updatedAt = new Date();
      await job.save();

      return res.status(200).json({
        message: 'Brend tekshiruvga yuborildi',
        brandName: job.brandName,
        status: job.status
      });
    } catch (err) {
      console.error('Brendni tekshiruvga yuborishda xatolik:', err);
      return res.status(500).json({ message: 'Server xatosi', error: err.message });
    }
  });

  // Tekshiruvchi uchun brend tekshiruvi natijasini saqlash
  app.post('/api/job-actions/:jobId/review-brand', auth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const { approved, reason } = req.body;
      
      console.log(`[TEKSHIRUV] Kelgan ma'lumot:`, req.body);
      
      const job = await Job.findById(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Ish topilmadi' });
      }
      
      // Tekshiruv natijasiga ko'ra statusni yangilash
      if (approved === true) {
        job.status = 'approved';
        job.reviewResult = { approved: true, date: new Date() };
        console.log(`[TEKSHIRUV] Job ${jobId} - "${job.brandName}" brendi TASDIQLANDI`);
      } else {
        job.status = 'returned_to_operator';
        job.reviewResult = { 
          approved: false, 
          reason: reason || 'Sabab ko\'rsatilmagan', 
          date: new Date() 
        };
        console.log(`[TEKSHIRUV] Job ${jobId} - "${job.brandName}" brendi RAD ETILDI: ${reason}`);
      }
      
      job.updatedAt = new Date();
      await job.save();
      
      return res.status(200).json({ 
        message: approved ? 'Brend tasdiqlandi' : 'Brend rad etildi va operatorga qaytarildi', 
        status: job.status,
        brandName: job.brandName
      });
    } catch (err) {
      console.error('Brend tekshiruvi natijasini saqlashda xatolik:', err);
      return res.status(500).json({ 
        message: 'Brend tekshiruvi natijasini saqlashda serverda xatolik', 
        error: err.message 
      });
    }
  });
  
  // Hujjatlarni yuborish
  app.post('/api/job-actions/:jobId/submit-documents', auth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const { personType, yuridikDocs, jismoniyDocs } = req.body;
      if (!personType) return res.status(400).json({ message: 'Shaxs turi kiritilmagan' });

      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

      job.personType = personType;
      // job.classes = [] // olib tashlandi

      if (personType === 'yuridik' && yuridikDocs) job.yuridikDocs = yuridikDocs;
      else if (personType === 'jismoniy' && jismoniyDocs) job.jismoniyDocs = jismoniyDocs;

      job.status = 'documents_submitted';
      job.updatedAt = new Date();
      await job.save();

      return res.status(200).json({ message: 'Hujjatlar muvaffaqiyatli yuborildi', personType: job.personType, status: job.status });
    } catch (err) {
      console.error('Hujjatlarni yuborishda xatolik:', err);
      return res.status(500).json({ message: 'Server xatosi', error: err.message });
    }
  });
  
  // Ishonchnoma uchun ma'lumotlarni yuklash
  app.get('/api/job-actions/:jobId/power-of-attorney', auth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ message: 'Ish topilmadi' });

      return res.status(200).json({
        jshshr: '31234567890123',
        clientInfo: { name: job.clientName || '', surname: job.clientSurname || '', phone: job.phone || '' },
        companyInfo: job.yuridikDocs || {},
        personInfo: job.jismoniyDocs || {},
        brandName: job.brandName || '',
        createdAt: new Date()
      });
    } catch (err) {
      console.error('Ishonchnoma ma\'lumotlarini olishda xatolik:', err);
      return res.status(500).json({ message: 'Server xatosi', error: err.message });
    }
  });
};
      
      console.log(`[HUJJATLAR] Job ${jobId} uchun ${personType} shaxs hujjatlari yuborildi`);
      return res.status(200).json({ 
        message: 'Hujjatlar muvaffaqiyatli yuborildi', 
        personType: job.personType,
        status: job.status
      });
    } catch (err) {
      console.error('Hujjatlarni yuborishda xatolik:', err);
      return res.status(500).json({ 
        message: 'Hujjatlarni yuborishda serverda xatolik', 
        error: err.message 
      });
    }
  });
  
  // Ishonchnoma uchun ma'lumotlarni yuklash
  app.get('/api/job-actions/:jobId/power-of-attorney', auth, async (req, res) => {
    try {
      const { jobId } = req.params;
      
      const job = await Job.findById(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Ish topilmadi' });
      }
      
      // JSHHR va boshqa ma'lumotlar
      return res.status(200).json({
        jshshr: '31234567890123', // Haqiqiy holatlarda bu ma'lumot qayerdandir olinishi kerak
        clientInfo: {
          name: job.clientName || '',
          surname: job.clientSurname || '',
          phone: job.phone || '',
        },
        companyInfo: job.yuridikDocs || {},
        personInfo: job.jismoniyDocs || {},
        brandName: job.brandName || '',
        classes: job.classes || [],
        createdAt: new Date()
      });
    } catch (err) {
      console.error('Ishonchnoma ma\'lumotlarini olishda xatolik:', err);
      return res.status(500).json({
        message: 'Ishonchnoma ma\'lumotlarini olishda xatolik',
        error: err.message
      });
    }
  });
};
