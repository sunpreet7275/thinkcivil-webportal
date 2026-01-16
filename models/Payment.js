const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['pre', 'mains', 'combo'],
    required: true
  },
  bank: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  baseAmount: {
    type: Number,
    required: true
  },
  gst: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true
  },
  paymentGatewayResponse: {
    type: Object
  }
}, {
  timestamps: true
});

// Generate transaction ID before saving
paymentSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);