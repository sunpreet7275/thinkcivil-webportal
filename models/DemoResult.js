const mongoose = require('mongoose');

const demoResultSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DemoTest',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    questionUid: {
      type: String,
      required: true
    },
    questionIndex: {
      type: Number,
      required: true
    },
    selectedOption: {
      type: Number,
      required: true,
      min: -1, // -1 for unattempted
      max: 3
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    isAttempted: {
      type: Boolean,
      default: false
    },
    correctAnswer: {
      type: Number,
      required: true
    },
    marksObtained: {
      type: Number,
      default: 0
    }
  }],
  score: {
    type: Number,
    default: 0
  },
  totalMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    default: 0
  },
  timeTaken: {
    type: Number, // in seconds
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  summary: {
    totalQuestions: Number,
    correctAnswers: Number,
    wrongAnswers: Number,
    unattempted: Number,
    marksPerQuestion: Number,
    negativeMarks: Number
  }
}, {
  timestamps: true
});

// Index for better performance - Note: Not unique because students can retake demo tests
demoResultSchema.index({ test: 1, student: 1 });
demoResultSchema.index({ student: 1, submittedAt: -1 });
demoResultSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('DemoResult', demoResultSchema);