const mongoose = require('mongoose');

const SalarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2100
  },
  baseSalary: {
    type: Number,
    required: true
  },
  bonus: {
    type: Number,
    default: 0
  },
  deduction: {
    type: Number,
    default: 0
  },
  comment: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique combination of userId, month, and year
SalarySchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

// Update the updatedAt field before saving
SalarySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before updating
SalarySchema.pre('findOneAndUpdate', function(next) {
  this.update({}, { $set: { updatedAt: Date.now() } });
  next();
});

const Salary = mongoose.model('Salary', SalarySchema);

module.exports = Salary;
