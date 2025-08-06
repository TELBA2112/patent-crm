const mongoose = require('mongoose');

const brandRequestSchema = new mongoose.Schema({
  isDocsSubmitted: { type: Boolean, default: false },
  docType: { type: String, enum: ['yuridik', 'jismoniy'] },
  documents: { type: Object }, // barcha bosqichdagi ma'lumotlar shu yerda saqlanadi    
  operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brandName: { type: String, required: true },
  hasLogo: { type: Boolean, default: false },
  logoUrl: { type: String },
  comment: { type: String },
  screenshotUrl: { type: String },
  invoiceScreenshotUrl: { type: String },
  finalDocumentUrl: { type: String },
  lawyerNote: { type: String },
  status: {
    type: String,
    enum: ['pending', 'checked', 'rejected', 'docs_submitted', 'docs_reviewed', 'sent_to_lawyer'],
    default: 'pending'
  },
  documentReview: {
    comment: String,
    fileUrl: String // xatolik bo‘lsa, fayl biriktirish
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BrandRequest', brandRequestSchema);
