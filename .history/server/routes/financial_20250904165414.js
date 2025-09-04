const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const FinancialTransaction = mongoose.model('FinancialTransaction');

// Get financial summary
router.get('/summary', auth, async (req, res) => {
  // Only admin can view financial summary
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu ma\'lumotlarni ko\'rish uchun huquqingiz yo\'q' });
  }

  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate) {
      dateFilter.date = { $gte: new Date(startDate) };
    }
    
    if (endDate) {
      dateFilter.date = { ...dateFilter.date, $lte: new Date(endDate + 'T23:59:59.999Z') };
    }
    
    // Get income transactions
    const incomeTransactions = await FinancialTransaction.find({
      ...dateFilter,
      type: 'income'
    });
    
    // Get expense transactions
    const expenseTransactions = await FinancialTransaction.find({
      ...dateFilter,
      type: 'expense'
    });
    
    // Calculate totals
    const totalIncome = incomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const profit = totalIncome - totalExpenses;
    
    // Group income by category
    const incomeByCategory = {};
    incomeTransactions.forEach(transaction => {
      if (!incomeByCategory[transaction.category]) {
        incomeByCategory[transaction.category] = 0;
      }
      incomeByCategory[transaction.category] += transaction.amount;
    });
    
    // Group expenses by category
    const expensesByCategory = {};
    expenseTransactions.forEach(transaction => {
      if (!expensesByCategory[transaction.category]) {
        expensesByCategory[transaction.category] = 0;
      }
      expensesByCategory[transaction.category] += transaction.amount;
    });
    
    // Format for response
    const incomeBreakdown = Object.entries(incomeByCategory).map(([name, amount]) => ({
      name,
      amount
    }));
    
    const expenseBreakdown = Object.entries(expensesByCategory).map(([name, amount]) => ({
      name,
      amount
    }));
    
    res.json({
      totalIncome,
      totalExpenses,
      profit,
      incomeBreakdown,
      expenseBreakdown,
      period: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (error) {
    console.error('Moliyaviy ma\'lumotlarni olishda xatolik:', error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
});

// Get transactions with filters
router.get('/transactions', auth, async (req, res) => {
  // Only admin can view transactions
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu ma\'lumotlarni ko\'rish uchun huquqingiz yo\'q' });
  }

  try {
    const { startDate, endDate, type, category, jobId } = req.query;
    const filter = {};
    
    // Apply date filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    // Apply type filter
    if (type && ['income', 'expense'].includes(type)) {
      filter.type = type;
    }
    
    // Apply category filter
    if (category) {
      filter.category = category;
    }
    
    // Apply job filter
    if (jobId) {
      filter.jobId = jobId;
    }
    
    const transactions = await FinancialTransaction.find(filter)
      .sort({ date: -1 })
      .populate('createdBy', 'username firstName lastName');
      
    res.json(transactions);
  } catch (error) {
    console.error('Tranzaksiyalarni olishda xatolik:', error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
});

// Create a new transaction
router.post('/transactions', auth, async (req, res) => {
  // Only admin can create transactions
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Tranzaksiya yaratish uchun huquqingiz yo\'q' });
  }

  try {
    const { date, amount, type, category, description, jobId, metadata } = req.body;
    
    // Validate required fields
    if (!amount || !type || !category || !description) {
      return res.status(400).json({ message: 'Barcha zarur ma\'lumotlar kiritilmagan' });
    }
    
    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Tranzaksiya turi noto\'g\'ri' });
    }
    
    // Create new transaction
    const transaction = new FinancialTransaction({
      date: date ? new Date(date) : new Date(),
      amount: parseFloat(amount),
      type,
      category,
      description,
      jobId: jobId || null,
      job: null, // Can be populated if needed
      createdBy: req.user.id,
      metadata: metadata || {}
    });
    
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Tranzaksiya yaratishda xatolik:', error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
});

// Get transaction by ID
router.get('/transactions/:id', auth, async (req, res) => {
  // Only admin can view transaction details
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu ma\'lumotlarni ko\'rish uchun huquqingiz yo\'q' });
  }
  
  try {
    const transaction = await FinancialTransaction.findById(req.params.id)
      .populate('createdBy', 'username firstName lastName');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Tranzaksiya topilmadi' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Tranzaksiya ma\'lumotlarini olishda xatolik:', error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
});

// Update a transaction
router.put('/transactions/:id', auth, async (req, res) => {
  // Only admin can update transactions
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Tranzaksiyani yangilash uchun huquqingiz yo\'q' });
  }
  
  try {
    const { date, amount, type, category, description, jobId, metadata } = req.body;
    
    // Validate required fields
    if (!amount || !type || !category || !description) {
      return res.status(400).json({ message: 'Barcha zarur ma\'lumotlar kiritilmagan' });
    }
    
    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Tranzaksiya turi noto\'g\'ri' });
    }
    
    // Check if transaction exists
    const transaction = await FinancialTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Tranzaksiya topilmadi' });
    }
    
    // Update transaction
    transaction.date = date ? new Date(date) : transaction.date;
    transaction.amount = parseFloat(amount);
    transaction.type = type;
    transaction.category = category;
    transaction.description = description;
    transaction.jobId = jobId || null;
    if (metadata) transaction.metadata = metadata;
    transaction.updatedAt = Date.now();
    
    await transaction.save();
    res.json(transaction);
  } catch (error) {
    console.error('Tranzaksiyani yangilashda xatolik:', error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
});

// Delete a transaction
router.delete('/transactions/:id', auth, async (req, res) => {
  // Only admin can delete transactions
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Tranzaksiyani o\'chirish uchun huquqingiz yo\'q' });
  }
  
  try {
    const result = await FinancialTransaction.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({ message: 'Tranzaksiya topilmadi' });
    }
    
    res.json({ message: 'Tranzaksiya muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.error('Tranzaksiyani o\'chirishda xatolik:', error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
});

// Get available categories
router.get('/categories', auth, async (req, res) => {
  // Only admin can view categories
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu ma\'lumotlarni ko\'rish uchun huquqingiz yo\'q' });
  }
  
  try {
    // Get distinct categories from the database
    const incomeCategories = await FinancialTransaction.distinct('category', { type: 'income' });
    const expenseCategories = await FinancialTransaction.distinct('category', { type: 'expense' });
    
    // Add default categories if needed
    const defaultIncomeCategories = ['Xizmat ko\'rsatish', 'Litsenziya', 'Boshqa kirimlar'];
    const defaultExpenseCategories = ['Oyliklar', 'Ijara', 'Soliqlar', 'Kommunal', 'Boshqa xarajatlar'];
    
    const allIncomeCategories = [...new Set([...incomeCategories, ...defaultIncomeCategories])];
    const allExpenseCategories = [...new Set([...expenseCategories, ...defaultExpenseCategories])];
    
    res.json({
      income: allIncomeCategories.sort(),
      expense: allExpenseCategories.sort()
    });
  } catch (error) {
    console.error('Kategoriyalarni olishda xatolik:', error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
});

module.exports = router;
