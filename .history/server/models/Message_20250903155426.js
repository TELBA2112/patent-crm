const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toRole: { type: String, enum: ['operator', 'tekshiruvchi', 'yurist', 'admin'], required: true },
  text: { type: String, default: '' },
  file: {
    path: String,
    name: String,
    mimeType: String,
    size: Number
  },
  createdAt: { type: Date, default: Date.now },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Message', messageSchema);
