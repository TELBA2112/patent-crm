const mongoose = require('mongoose');

// Counter schema for auto-incrementing job IDs
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// History schema
const historySchema = new mongoose.Schema({
  action: { type: String, required: true },
  status: { type: String, required: true },
  reason: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now }
});

// Main job schema
const jobSchema = new mongoose.Schema({
  // Simple numeric ID field that will be auto-incremented
  jobId: {
    type: Number,
    unique: true,
    sparse: true // Bu indeksning null qiymatlar uchun noyob bo'lmasligini ta'minlaydi
  },
  
  // Eski jobNo maydonini o'chirish kerak - MongoDB'dan ham o'chirish kerak
  // jobNo maydonini qo'shmasdan o'tib ketamiz
  
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
  status: {
    type: String,
    enum: [
      'yangi',                // Operator tizimga kiritilgan yangi ish
      'bajarilmoqda',         // Operator ishlayotgan
      'brand_in_review',      // Tekshiruvchiga yuborilgan
      'approved',             // Tekshiruvchi tasdiqlagan
      'rejected',             // Tekshiruvchi rad etgan
      'returned_to_operator', // Tekshiruvchi rad etgandan so'ng operatorga qaytgan
      'documents_pending',    // Tekshiruvchi tasdiqlagan, hujjatlarni yig'ish kerak
      'documents_submitted',  // Hujjatlar tekshiruvchiga yuborilgan
      'documents_returned',   // Tekshiruvchi hujjatlarni qaytargan
      'to_lawyer',            // Yuristga yuborilgan
      'lawyer_processing',    // Yurist ko'rib chiqmoqda
      'lawyer_completed',     // Yurist yakunlagan
      'finished',             // Jarayon tugagan
      'bajarildi'             // Ish bajarilgan
    ],
    default: 'yangi'
  },
  personType: {
    type: String,
    enum: ['yuridik', 'jismoniy'],
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tekshiruvchi: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  yurist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  certificatesPath: String,
  brandLogo: String,
  comments: String,
  callResult: String,
  clientIntent: String,
  futureDate: Date,
  yuridikDocs: Object,
  jismoniyDocs: Object,
  createdAt: {
    type: Date,
    default: Date.now
  },
  history: [historySchema]
});

// Pre-save middleware to auto-increment jobId
jobSchema.pre('save', async function(next) {
  try {
    // Only auto-increment for new documents
    if (this.isNew) {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'jobId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      
      // Set the jobId field to the incremented sequence value
      this.jobId = counter.seq;
      
      console.log(`New job created with ID: ${this.jobId}`);
    }
    
    // Always update the timestamp
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    console.error('Error auto-incrementing job ID:', error);
    next(error);
  }
});

// Status o'zgarishini avtomatik log qilish
jobSchema.pre('save', function(next) {
  if (!this.isNew && this.isModified('status')) {
    this.history.push({
      action: 'Status o`zgartirildi',
      status: this.status,
      reason: this.comments || '',
      updatedBy: this._updatingUser || null,
      date: new Date()
    });
  }
  next();
});

// findOneAndUpdate uchun ham tarix logi
jobSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update.status) {
    const job = await this.model.findOne(this.getQuery());
    if (job && job.status !== update.status) {
      const historyEntry = {
        action: 'Status o`zgartirildi',
        status: update.status,
        reason: update.comments || '',
        updatedBy: update._updatingUser || null,
        date: new Date()
      };
      update.$push = update.$push || {};
      update.$push.history = historyEntry;
      this.setUpdate(update);
    }
  }
  next();
});

module.exports = mongoose.model('Job', jobSchema);