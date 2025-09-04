const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model('Counter', counterSchema);

const historySchema = new mongoose.Schema({
  action: { type: String, required: true }, // Yangi: "Yuborildi", "Tekshirildi", etc.
  status: { type: String, required: true },
  reason: { type: String }, // Sabab (rad etilgan bo'lsa)
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now }
});

const jobSchema = new mongoose.Schema({
  jobNo: { type: Number, unique: true },
  clientName: { type: String },
  clientSurname: { type: String },
  phone: { type: String, required: true },
  brandName: { type: String },
  brandLogo: { type: String },
  comments: { type: String },
  status: { 
    type: String, 
    enum: [
      'yangi',
      'contacted',
      'brand_sent',
      'documents_pending',
      'approved',
      'rejected',
      'to_lawyer',
      'certificates_ready',
      'finished',
      'in_review', // Tekshiruvchi ko'rib chiqayotgan status
      'brand_in_review' // Yangi: Brend tekshiruvga yuborilgan status
    ], 
    default: 'yangi' 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tekshiruvchi: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  yurist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jarayonStep: { type: Number, default: 1 },
  clientInterest: { type: Number, enum: [0, 1, 2, 3], default: 0 },
  history: [historySchema],
  personType: { type: String, enum: ['yuridik', 'jismoniy'], default: '' },
  yuridikDocs: { type: Array, default: [] }, // Images array (paths)
  jismoniyDocs: { type: Array, default: [] },
  certificates: { type: String }, // .rar path
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Avto-increment jobNo
jobSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'jobNo' },
        { $inc: { seq: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      this.jobNo = counter ? counter.seq : 1;
    } catch (err) {
      console.error('Counter (jobNo) xatosi:', err);
      return next(new Error('JobNo counter xatosi: ' + err.message));
    }
  }
  this.updatedAt = Date.now();
  next();
});

// Status o‘zgarishini avtomatik log qilish (universal tarix)
jobSchema.pre('save', function(next) {
  if (!this.isNew && this.isModified('status')) {
    this.history.push({
      action: 'Status o‘zgartirildi',
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
        action: 'Status o‘zgartirildi',
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