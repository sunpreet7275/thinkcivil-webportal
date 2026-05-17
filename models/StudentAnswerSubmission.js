const mongoose = require('mongoose');

const answerSubmissionSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  answerPDF: {
    type: String,
    required: [true, 'Answer PDF is required']
  },
  language: {
    type: String,
    enum: ['en', 'hi'],
    default: 'en'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const studentAnswerSubmissionSchema = new mongoose.Schema({
  answerWritingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AnswerWriting',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [answerSubmissionSchema],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isLate: {
    type: Boolean,
    default: false
  },
  submissionLanguage: {
    type: String,
    enum: ['en', 'hi'],
    default: 'en'
  }
}, {
  timestamps: true
});

// Ensure one submission per student per exercise
studentAnswerSubmissionSchema.index({ answerWritingId: 1, studentId: 1 }, { unique: true });
studentAnswerSubmissionSchema.index({ submissionLanguage: 1 });

module.exports = mongoose.model('StudentAnswerSubmission', studentAnswerSubmissionSchema);