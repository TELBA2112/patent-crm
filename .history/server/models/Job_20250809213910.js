const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  clientName: { type: String },
  clientSurname: { type: String },
  phone: { type: String, required: true },
  brandName: { type: String, required: true },
  brandLogo: { type: String, default: null },
  comments: { type: String, default: '' },
  status: {
    type: String,
    enum: ['yangi', 'boglandi', 'tekshiruvchi', 'tugatilgan'],
    default: 'yangi'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  jarayonStep: { type: Number, default: 1 },
  clientInterest: { type: Number, default: 0 },
  personType: {
    type: String,
    enum: ['yuridik', 'jismoniy'],
    required: true,
    default: 'yuridik'
  },
  yuridikDocs: { type: mongoose.Schema.Types.Mixed, default: {} },
  jismoniyDocs: { type: mongoose.Schema.Types.Mixed, default: {} },
  files: { type: [String], default: [] },
  history: [
    {
      status: { type: String },
      comment: { type: String, default: '' },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
