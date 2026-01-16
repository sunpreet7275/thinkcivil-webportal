const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  fileLink: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
});

const subjectSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true
  },
  documents: [documentSchema]
});

const syllabusSchema = new mongoose.Schema({
  prelims: {
    gs1: documentSchema,
    gs2: documentSchema
  },
  mains: {
    essay: documentSchema,
    gs1: documentSchema,
    gs2: documentSchema,
    gs3: documentSchema,
    gs4: documentSchema,
    optionalSubjects: [subjectSchema]
  },
  type: {
    type: String,
    enum: ['prelims', 'mains'],
    required: true
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

module.exports = mongoose.model('Syllabus', syllabusSchema);