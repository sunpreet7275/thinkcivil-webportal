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

// Student routes
router.get('/available', auth, getAvailableExercises);
router.get('/my-submissions', auth, getMySubmissions);
router.get('/:id', auth, getAnswerWritingById);
router.post('/:id/submit', auth, submitAnswers);

// Admin routes
router.get('/admin/all', auth, adminAuth, getAllAnswerWritingAdmin);
router.post('/', auth, adminAuth, createAnswerWriting);
router.put('/:id', auth, adminAuth, updateAnswerWriting);
router.delete('/:id', auth, adminAuth, deleteAnswerWriting);
router.patch('/:id/toggle-status', auth, adminAuth, toggleExerciseStatus);
router.get('/:id/submissions', auth, adminAuth, getExerciseSubmissions);

module.exports = router;