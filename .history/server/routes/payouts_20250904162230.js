const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');
const User = mongoose.model('User');

// Schema for withdrawal requests
const withdrawalRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  mood: { type: Number, min: 1, max: 5, required: true },
  cardDetails: {
    cardNumber: { type: String, required: true },
    cardHolder: { type: String, required: true },
    bankName: { type: String, required: true }
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  comment: { type: String },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiptPath: { type: String }
});

// Register model if not already registered
let WithdrawalRequest;
try {
  WithdrawalRequest = mongoose.model('WithdrawalRequest');
} catch (e) {
  WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
}

// Get user cards
router.get('/cards', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find the user and get their saved cards
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }
    
    // Return saved cards or empty array
    return res.status(200).json({ 
      cards: user.savedCards || [] 
    });
  } catch (err) {
    console.error('Kartalarni olishda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Add a new card
router.post('/cards', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardNumber, cardHolder, bankName } = req.body;
    
    // Validate required fields
    if (!cardNumber || !cardHolder || !bankName) {
      return res.status(400).json({ message: 'Barcha maydonlar to\'ldirilishi shart' });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }
    
    // Initialize cards array if doesn't exist
    if (!user.savedCards) {
      user.savedCards = [];
    }
    
    // Check for duplicate card number
    const isDuplicate = user.savedCards.some(card => card.cardNumber === cardNumber);
    if (isDuplicate) {
      return res.status(400).json({ message: 'Bu karta allaqachon saqlangan' });
    }
    
    // Add new card
    const newCard = {
      id: new mongoose.Types.ObjectId(),
      cardNumber,
      cardHolder,
      bankName,
      addedAt: new Date()
    };
    
    user.savedCards.push(newCard);
    await user.save();
    
    return res.status(201).json({ 
      message: 'Karta muvaffaqiyatli saqlandi', 
      card: newCard 
    });
  } catch (err) {
    console.error('Karta qo\'shishda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Update an existing card
router.put('/cards/:cardId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;
    const { cardNumber, cardHolder, bankName } = req.body;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }
    
    // Find the card
    if (!user.savedCards) {
      return res.status(404).json({ message: 'Karta topilmadi' });
    }
    
    const cardIndex = user.savedCards.findIndex(c => c.id.toString() === cardId);
    if (cardIndex === -1) {
      return res.status(404).json({ message: 'Karta topilmadi' });
    }
    
    // Update card fields
    user.savedCards[cardIndex] = {
      ...user.savedCards[cardIndex],
      cardNumber: cardNumber || user.savedCards[cardIndex].cardNumber,
      cardHolder: cardHolder || user.savedCards[cardIndex].cardHolder,
      bankName: bankName || user.savedCards[cardIndex].bankName,
      updatedAt: new Date()
    };
    
    await user.save();
    
    return res.status(200).json({ 
      message: 'Karta muvaffaqiyatli yangilandi', 
      card: user.savedCards[cardIndex] 
    });
  } catch (err) {
    console.error('Kartani yangilashda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Delete a card
router.delete('/cards/:cardId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }
    
    // Check if user has saved cards
    if (!user.savedCards || !user.savedCards.length) {
      return res.status(404).json({ message: 'Karta topilmadi' });
    }
    
    // Filter out the card to delete
    const initialCount = user.savedCards.length;
    user.savedCards = user.savedCards.filter(card => card.id.toString() !== cardId);
    
    if (user.savedCards.length === initialCount) {
      return res.status(404).json({ message: 'Karta topilmadi' });
    }
    
    await user.save();
    
    return res.status(200).json({ message: 'Karta muvaffaqiyatli o\'chirildi' });
  } catch (err) {
    console.error('Kartani o\'chirishda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Create a withdrawal request
router.post('/withdrawal', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, mood, cardId, comment } = req.body;
    
    // Validate required fields
    if (!amount || !mood || !cardId) {
      return res.status(400).json({ message: 'Barcha maydonlar to\'ldirilishi shart' });
    }
    
    // Validate mood value
    if (mood < 1 || mood > 5) {
      return res.status(400).json({ message: 'Kayfiyat 1 dan 5 gacha bo\'lishi kerak' });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }
    
    // Find the card
    if (!user.savedCards) {
      return res.status(404).json({ message: 'Karta topilmadi' });
    }
    
    const card = user.savedCards.find(c => c.id.toString() === cardId);
    if (!card) {
      return res.status(404).json({ message: 'Karta topilmadi' });
    }
    
    // Create withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      userId,
      amount,
      mood,
      cardDetails: {
        cardNumber: card.cardNumber,
        cardHolder: card.cardHolder,
        bankName: card.bankName
      },
      comment: comment || '',
      requestedAt: new Date()
    });
    
    await withdrawalRequest.save();
    
    return res.status(201).json({
      message: 'Pul yechish arizasi muvaffaqiyatli yuborildi',
      request: withdrawalRequest
    });
  } catch (err) {
    console.error('Pul yechish arizasini yuborishda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Get user's withdrawal requests
router.get('/withdrawal/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const requests = await WithdrawalRequest.find({ userId })
      .sort({ requestedAt: -1 });
    
    return res.status(200).json(requests);
  } catch (err) {
    console.error('Pul yechish arizalarini olishda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Admin: Get all withdrawal requests
router.get('/withdrawal/all', authenticate, async (req, res) => {
  try {
    // Check if the user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Ruxsat etilmagan harakat' });
    }
    
    const { status } = req.query;
    const query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    const requests = await WithdrawalRequest.find(query)
      .populate('userId', 'firstName lastName username role')
      .sort({ requestedAt: -1 });
    
    return res.status(200).json(requests);
  } catch (err) {
    console.error('Pul yechish arizalarini olishda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

// Admin: Process a withdrawal request
router.post('/withdrawal/:requestId/process', authenticate, async (req, res) => {
  try {
    // Check if the user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Ruxsat etilmagan harakat' });
    }
    
    const { requestId } = req.params;
    const { status, comment, receiptPath } = req.body;
    
    // Validate required fields
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Noto\'g\'ri status' });
    }
    
    // Find the request
    const request = await WithdrawalRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Ariza topilmadi' });
    }
    
    // Update request
    request.status = status;
    request.comment = comment || request.comment;
    request.processedAt = new Date();
    request.processedBy = req.user.id;
    
    // Add receipt path if approved
    if (status === 'approved' && receiptPath) {
      request.receiptPath = receiptPath;
    }
    
    await request.save();
    
    return res.status(200).json({
      message: `Ariza ${status === 'approved' ? 'tasdiqlandi' : 'rad etildi'}`,
      request
    });
  } catch (err) {
    console.error('Arizani qayta ishlashda xatolik:', err);
    return res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
});

module.exports = router;
