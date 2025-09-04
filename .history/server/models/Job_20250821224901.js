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
      'in_review',
      'brand_in_review',
      'aloqa_uzildi',
      'keyinroq',
      'rad_etildi'
    ],
    default: 'yangi' 
  },
  callResult: { type: String }, // Mijoz bilan bog'lanish natijasi
  clientIntent: { type: String }, // Mijozning keyingi maqsadi
  futureDate: { type: Date }, // Keyinroq bog'lanish sanasi
  certificatesPath: { type: String }, // Guvohnoma fayl manzili
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Operator
  tekshiruvchi: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Tekshiruvchi
  yurist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Yurist
  personType: { type: String, enum: ['yuridik', 'jismoniy'] }, // Mijoz shaxs turi
  yuridikDocs: { type: Object }, // Yuridik shaxs hujjatlari
  jismoniyDocs: { type: Object }, // Jismoniy shaxs hujjatlari
  history: [historySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

jobSchema.pre('save', async function(next) {
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
      this.getUpdate().$push = { history: historyEntry };
    }
  }
  next();
});

module.exports = mongoose.model('Job', jobSchema);