const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  type: { type: String, enum: [
    'job_assigned',
    'invoice_sent',
    'receipt_uploaded',
    'payment_confirmed',
    'notification_required',
    'job_completed',
    'job_archived',
    'chat_message'
  ], required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

module.exports = mongoose.model('Notification', notificationSchema);
