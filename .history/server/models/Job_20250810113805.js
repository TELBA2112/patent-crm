const mongoose = require('mongoose');

// Counter — jobNo uchun ketma-ket raqam
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model('Counter', counterSchema);

// Ish tarixini saqlash
const historySchema = new mongoose.Schema({
  prevStatus: { type: String }, // Oldingi status
  status: { type: String, required: true }, // Yangi status
  comment: { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now }
});

// Asosiy Job modeli
const jobSchema = new mongoose.Schema({
  jobNo: { type: Number, unique: true }, // Ketma-ket ish raqami
  clientName: { type: String },
  clientSurname: { type: String },
  phone: { type: String, required: true },
  brandName: { type: String },
  brandLogo: { type: String },
  comments: { type: String },

  status: { 
    type: String, 
    enum: ['yangi', 'boglandi', 'tekshiruvchi', 'band', 'tugatilgan', 'jarayonda', 'kutilmoqda'], 
    default: 'yangi' 
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tekshiruvchi: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jarayonStep: { type: Number, default: 1 },
  clientInterest: { type: Number, enum: [0, 1, 2, 3], default: 0 },
  history: [historySchema],

  personType: { type: String, enum: ['yuridik', 'jismoniy'], required: true },

  // Yuridik shaxs hujjatlari
  yuridikDocs: {
    mchjNomi: { type: String },
    mchjManzili: { type: String },
    stir: { type: String },
    oked: { type: String },
    xr: { type: String },
    bank: { type: String },
    mfo: { type: String },
    logo: { type: String },
    brandName: { type: String },
    direktorPassport: { type: String },
  },

  // Jismoniy shaxs hujjatlari
  jismoniyDocs: {
    passport: { type: String },
    brandName: { type: String },
    manzil: { type: String },
  },

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

// Yangilanishdan oldin updatedAt va history qo‘shish
jobSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  const docToUpdate = await this.model.findOne(this.getQuery());

  if (update.status && update.status !== docToUpdate.status) {
    const historyEntry = {
      prevStatus: docToUpdate.status,
      status: update.status,
      comment: update.comments || '',
      updatedBy: update.updatedBy || null,
      date: new Date()
    };
    update.$push = update.$push || {};
    update.$push.history = historyEntry;
  }

  update.updatedAt = new Date();
  this.set(update);
  next();
});

module.exports = mongoose.model('Job', jobSchema);
