const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  status: { type: String, required: true },
  comment: { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now }
});

const jobSchema = new mongoose.Schema({
  clientName: { type: String },
  clientSurname: { type: String },
  phone: { 
    type: String, 
    required: true,
    // match: /^[0-9+\-\s]+$/, // Telefon raqam uchun regex (ixtiyoriy)
  },
  brandName: { type: String },
  brandLogo: { type: String },
  comments: { type: String },
  status: { 
    type: String, 
    enum: [
      'yangi',
      'boglandi',
      'tekshiruvchi',
      'tugatilgan',
      'jarayonda',
      'kutilmoqda',
      'bajarilmoqda',
      'bajarildi',
      'brand_in_review',
      'approved',
      'returned_to_operator',
      'documents_pending',
      'documents_submitted',
      'finished',
      'to_lawyer',
      'lawyer_processing',
      'lawyer_completed',
  'notification_uploaded',
      'keyinroq',
      'rejected',
      'aloqa_uzildi'
    ], 
    default: 'yangi' 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tekshiruvchi: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // MKTU sinflari (masalan: [25, 35])
  classes: { type: [Number], default: [] },
  // Mijoz shaxs turi
  personType: { type: String, enum: ['yuridik', 'jismoniy'], default: undefined },
  // Hujjatlar - soddalik uchun Mixed qo'llaymiz
  yuridikDocs: { type: mongoose.Schema.Types.Mixed },
  jismoniyDocs: { type: mongoose.Schema.Types.Mixed },
  // Tekshiruv natijasi (tasdiq/rad etish sababi vaqti bilan)
  reviewResult: { type: mongoose.Schema.Types.Mixed },
  // Ishonchnoma (Power of Attorney) ma'lumoti
  powerOfAttorney: { type: mongoose.Schema.Types.Mixed },
  // Hujjatlar ro'yxati (masalan: ishonchnoma PDF/HTML)
  documents: { type: [mongoose.Schema.Types.Mixed], default: [] },
  // To'lov hisoblari (invoice) ro'yxati
  invoices: {
    type: [new mongoose.Schema({
      amount: { type: Number, required: false },
      comment: { type: String },
      filePath: { type: String, required: true },
  status: { type: String, enum: ['pending', 'receipt_uploaded', 'paid'], default: 'pending' },
      createdAt: { type: Date, default: Date.now },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      // Payment info
      paidAt: { type: Date },
      receiptPath: { type: String },
      paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }, { _id: true, id: true })],
    default: []
  },
  jarayonStep: { type: Number, default: 1 },
  clientInterest: { type: Number, enum: [0, 1, 2, 3], default: 0 },
  history: [historySchema],
  // Arxivlash maydonlari
  archived: { type: Boolean, default: false },
  archivedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

jobSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Job', jobSchema);
