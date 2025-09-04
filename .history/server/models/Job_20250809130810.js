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

jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

jobSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Job', jobSchema);
