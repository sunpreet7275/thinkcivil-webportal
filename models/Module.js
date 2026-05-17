// models/Module.js
const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  name: {
    english: {
      type: String,
      required: true,
      trim: true
    },
    hindi: {
      type: String,
      required: true,
      trim: true
    }
  },
  image: {
    type: String, // Will store base64 string
    required: true
  },
  icon: {
    type: String,
    default: 'bi-book'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Module', moduleSchema);