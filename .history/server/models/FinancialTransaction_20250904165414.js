const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FinancialTransactionSchema = new Schema({
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  jobId: {
    type: String, // Stores the job ID if transaction is related to a specific job
    default: null
  },
  // Reference to a job if needed
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Additional metadata for the transaction
  metadata: {
    type: Object,
    default: {}
  }
});

// Update the updatedAt field before saving
FinancialTransactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const FinancialTransaction = mongoose.model('FinancialTransaction', FinancialTransactionSchema);

module.exports = FinancialTransaction;
