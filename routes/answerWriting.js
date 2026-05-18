const express = require('express');
const router = express.Router();
const {
  createAnswerWriting,
  getAllAnswerWritingAdmin,
  getAvailableExercises,
  getAnswerWritingById,
  updateAnswerWriting,
  deleteAnswerWriting,
  toggleExerciseStatus,
  submitAnswers,
  getMySubmissions,
  getExerciseSubmissions
} = require('../controllers/answerWritingController');
const { auth, adminAuth } = require('../middleware/auth');
const { uploadAnswerSheet } = require('../config/r2');

// Student routes
router.get('/available', auth, getAvailableExercises);
router.get('/my-submissions', auth, getMySubmissions);
router.get('/:id', auth, getAnswerWritingById);
router.post('/:id/submit', auth, uploadAnswerSheet, submitAnswers);

// Admin routes
router.get('/admin/all', auth, adminAuth, getAllAnswerWritingAdmin);
router.post('/', auth, adminAuth, createAnswerWriting);
router.put('/:id', auth, adminAuth, updateAnswerWriting);
router.delete('/:id', auth, adminAuth, deleteAnswerWriting);
router.patch('/:id/toggle-status', auth, adminAuth, toggleExerciseStatus);
router.get('/:id/submissions', auth, adminAuth, getExerciseSubmissions);

// Add a test endpoint temporarily
router.get('/test-r2', async (req, res) => {
  try {
    const { s3Client } = require('../config/r2');
    const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
    
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: 'answer-sheets/',
      MaxKeys: 5
    });
    
    const response = await s3Client.send(command);
    
    res.json({
      success: true,
      files: response.Contents || [],
      publicUrl: process.env.R2_PUBLIC_URL
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;