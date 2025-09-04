const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'operator', 'tekshiruvchi', 'yurist'], required: true },
  firstName: String,
  lastName: String,
  avatar: String,
  balance: Number,
});

module.exports = mongoose.model('User', userSchema);