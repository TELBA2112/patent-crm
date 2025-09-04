const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model('Counter', counterSchema);

const historySchema = new mongoose.Schema({
  status: { type: String, required: true },
  comment: { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now }
});

const jobSchema = new mongoose.Schema({
  jobNo: { type: Number, unique: true }, // Yangi maydon: ketma-ket raqam
  clientName: { type: String },
  clientSurname: { type: String },
  phone: { type: String, required: true },
  brandName: { type: String },
  brandLogo: { type: String },
  comments: { type: String },
  status: { 
    type: String, 
    enum: ['yangi', 'boglandi', 'tekshiruvchi', 'tugatilgan', 'jarayonda', 'kutilmoqda'], 
    default: 'yangi' 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tekshiruvchi: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jarayonStep: { type: Number, default: 1 },
  clientInterest: { type: Number, enum: [0, 1, 2, 3], default: 0 },
  history: [historySchema],
  personType: { type: String, enum: ['yuridik', 'jismoniy'], default: '' },
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
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'jobNo' },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    this.jobNo = counter.seq;
  }
  this.updatedAt = Date.now();
  next();
});

jobSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Job', jobSchema);
