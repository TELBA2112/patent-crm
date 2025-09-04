const mongoose = require('mongoose');

// Card schema for saved payment cards
const cardSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  cardNumber: { type: String, required: true },
  cardHolder: { type: String, required: true },
  bankName: { type: String, required: true },
  addedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

// User schema with extended fields
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'operator', 'tekshiruvchi', 'yurist'], required: true },
  firstName: String,
  lastName: String,
  avatar: String,
  // Financial details
  balance: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  totalWithdrawn: { type: Number, default: 0 },
  lastMoodValue: { type: Number, min: 1, max: 5 },
  lastMoodDate: { type: Date },
  // Payment details
  savedCards: [cardSchema],
  // Preferences
  notificationSettings: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true }
  },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('User', userSchema);
