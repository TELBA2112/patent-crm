const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Salary = mongoose.model('Salary');
const User = mongoose.model('User');

// Get all salaries with optional filters
router.get('/', auth, async (req, res) => {
  // Only admin can view all salaries
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu ma\'lumotlarni ko\'rish uchun huquqingiz yo\'q' });
  }

  try {
    const filter = {};
    
    // Apply month filter
    if (req.query.month) {
      filter.month = parseInt(req.query.month);
    }
    
    // Apply year filter
    if (req.query.year) {
      filter.year = parseInt(req.query.year);
    }
    
    // Apply user filter
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    
    const salaries = await Salary.find(filter)
      .sort({ year: -1, month: -1 })
      .populate('userId', 'username firstName lastName role');
      
    res.json(salaries);
  } catch (error) {
    console.error('Oyliklar ro\'yxatini olishda xatolik:', error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
});

// Get a specific salary record
router.get('/:id', auth, async (req, res) => {
  // Only admin can view salary details
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu ma\'lumotlarni ko\'rish uchun huquqingiz yo\'q' });
  }
  
  try {
    const salary = await Salary.findById(req.params.id)
      .populate('userId', 'username firstName lastName role');
    
    if (!salary) {
      return res.status(404).json({ message: 'Oylik ma\'lumotlari topilmadi' });
    }
    
    res.json(salary);
  } catch (error) {
    console.error('Oylik ma\'lumotlarini olishda xatolik:', error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
});

// Create a new salary record
router.post('/', auth, async (req, res) => {
  // Only admin can create salary records
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Oylik ma\'lumotlarini yaratish uchun huquqingiz yo\'q' });
  }
  
  try {
    const { userId, month, year, baseSalary, bonus, deduction, comment } = req.body;
    
    // Validate required fields
    if (!userId || !month || !year || baseSalary === undefined) {
      return res.status(400).json({ message: 'Barcha zarur ma\'lumotlar kiritilmagan' });
    }
    
    // Check if user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }
    
    // Check if salary record already exists for this user/month/year
    const existingSalary = await Salary.findOne({ userId, month, year });
    if (existingSalary) {
      return res.status(409).json({ 
        message: 'Bu foydalanuvchi uchun ushbu oy/yil uchun allaqachon oylik ma\'lumoti mavjud' 
      });
    }
    
    // Create new salary record
    const salary = new Salary({
      userId,
      month,
      year,
      baseSalary,
      bonus: bonus || 0,
      deduction: deduction || 0,
      comment
    });
    
    await salary.save();
    res.status(201).json(salary);
  } catch (error) {
    console.error('Oylik ma\'lumotlarini yaratishda xatolik:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: 'Bu foydalanuvchi uchun ushbu oy/yil uchun allaqachon oylik ma\'lumoti mavjud' 
      });
    }
    
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
});

// Update a salary record
router.put('/:id', auth, async (req, res) => {
  // Only admin can update salary records
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Oylik ma\'lumotlarini yangilash uchun huquqingiz yo\'q' });
  }
  
  try {
    const { userId, month, year, baseSalary, bonus, deduction, comment } = req.body;
    
    // Validate required fields
    if (!userId || !month || !year || baseSalary === undefined) {
      return res.status(400).json({ message: 'Barcha zarur ma\'lumotlar kiritilmagan' });
    }
    
    // Check if salary exists
    const salary = await Salary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Oylik ma\'lumotlari topilmadi' });
    }
    
    // If changing month/year/userId, check for duplicates
    if (
      (salary.month !== month || salary.year !== year || salary.userId.toString() !== userId) && 
      await Salary.findOne({ userId, month, year, _id: { $ne: req.params.id } })
    ) {
      return res.status(409).json({ 
        message: 'Bu foydalanuvchi uchun ushbu oy/yil uchun allaqachon oylik ma\'lumoti mavjud' 
      });
    }
    
    // Update salary
    salary.userId = userId;
    salary.month = month;
    salary.year = year;
    salary.baseSalary = baseSalary;
    salary.bonus = bonus || 0;
    salary.deduction = deduction || 0;
    salary.comment = comment;
    salary.updatedAt = Date.now();
    
    await salary.save();
    res.json(salary);
  } catch (error) {
    console.error('Oylik ma\'lumotlarini yangilashda xatolik:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: 'Bu foydalanuvchi uchun ushbu oy/yil uchun allaqachon oylik ma\'lumoti mavjud' 
      });
    }
    
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
});

// Delete a salary record
router.delete('/:id', auth, async (req, res) => {
  // Only admin can delete salary records
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Oylik ma\'lumotlarini o\'chirish uchun huquqingiz yo\'q' });
  }
  
  try {
    const result = await Salary.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({ message: 'Oylik ma\'lumotlari topilmadi' });
    }
    
    res.json({ message: 'Oylik ma\'lumotlari muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.error('Oylik ma\'lumotlarini o\'chirishda xatolik:', error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
});

module.exports = router;
