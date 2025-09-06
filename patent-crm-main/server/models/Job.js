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
      'finalized',
      'keyinroq',
      'rejected',
      'aloqa_uzildi'
    ], 
    default: 'yangi' 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tekshiruvchi: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  classes: { type: [Number], default: [] },
  personType: { type: String, enum: ['yuridik', 'jismoniy'], default: undefined },
  yuridikDocs: { type: mongoose.Schema.Types.Mixed },
  jismoniyDocs: { type: mongoose.Schema.Types.Mixed },
  reviewResult: { type: mongoose.Schema.Types.Mixed },
  powerOfAttorney: { type: mongoose.Schema.Types.Mixed },
  documents: { type: [mongoose.Schema.Types.Mixed], default: [] },
  invoices: {
    type: [new mongoose.Schema({
      amount: { type: Number, required: false },
      comment: { type: String },
      filePath: { type: String, required: true },
      status: { type: String, enum: ['pending', 'receipt_uploaded', 'paid'], default: 'pending' },
      createdAt: { type: Date, default: Date.now },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      paidAt: { type: Date },
      receiptPath: { type: String },
      paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }, { _id: true, id: true })],
    default: []
  },
  completedAt: { type: Date },
  archived: { type: Boolean, default: false },
  archivedAt: { type: Date },
  certificatePath: { type: String },
  payouts: {
    type: new mongoose.Schema({
      operator: { amount: { type: Number, default: 0 }, approved: { type: Boolean, default: false } },
      tekshiruvchi: { amount: { type: Number, default: 0 }, approved: { type: Boolean, default: false } },
      yurist: { amount: { type: Number, default: 0 }, approved: { type: Boolean, default: false } },
      total: { type: Number, default: 0 },
      currency: { type: String, default: 'UZS' },
      note: { type: String, default: '' },
      calculatedAt: { type: Date },
      calculatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }, { _id: false }),
    default: undefined
  },
  jarayonStep: { type: Number, default: 1 },
  clientInterest: { type: Number, enum: [0, 1, 2, 3], default: 0 },
  history: [historySchema],
  archived: { type: Boolean, default: false },
  archivedAt: { type: Date },
  archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
