const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Ish tarixi uchun schema
const historySchema = new Schema({
  action: {
    type: String,
    required: true
  },
  status: {
    type: String
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Ishonchnoma uchun schema
const powerOfAttorneySchema = new Schema({
  content: String,
  personType: String,
  classes: [Number],
  format: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Asosiy Job sxemasi
const jobSchema = new Schema({
  jobId: {
    type: String,
    default: function() {
      return Math.floor(10000 + Math.random() * 90000).toString();
    }
  },
  clientName: {
    type: String,
    required: true
  },
  clientSurname: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  brandName: {
    type: String,
    default: ''
  },
  personType: {
    type: String,
    enum: ['yuridik', 'jismoniy'],
    required: true
  },
  status: {
    type: String,
    enum: [
      'yangi',
      'bajarilmoqda',
      'aloqa_uzildi',
      'keyinroq',
      'brand_in_review',
      'returned_to_operator',
      'approved',
      'documents_pending',
      'documents_submitted',
      'documents_returned',
      'to_lawyer',
      'lawyer_processing',
      'lawyer_completed',
      'bajarildi',
      'finished',
      'rejected'
    ],
    default: 'yangi'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  tekshiruvchi: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  yurist: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  classes: [Number],
  reviewResult: {
    approved: Boolean,
    reason: String,
    date: Date
  },
  yuridikDocs: {
    type: Schema.Types.Mixed
  },
  jismoniyDocs: {
    type: Schema.Types.Mixed
  },
  powerOfAttorney: powerOfAttorneySchema,
  history: [historySchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Job', jobSchema);