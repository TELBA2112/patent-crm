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
  // Yurist tomonidan tayyorlangan yoki saqlangan hujjatlar (formalar, rasm/skrins, va h.k.)
  documentData: { type: mongoose.Schema.Types.Mixed },
  // Yurist tomonidan yuklangan guvohnoma(lar) fayl yo'llari
  certificates: { type: [String], default: [] },
  // To'lov hisob(lar)i haqida ma'lumot
  invoice: { type: mongoose.Schema.Types.Mixed },
  // Tekshiruv natijasi (tasdiq/rad etish sababi vaqti bilan)
  reviewResult: { type: mongoose.Schema.Types.Mixed },
  jarayonStep: { type: Number, default: 1 },
  clientInterest: { type: Number, enum: [0, 1, 2, 3], default: 0 },
  history: [historySchema],
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
