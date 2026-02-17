const express = require('express');
const router = express.Router();
const { 
  getQuizzes, 
  getQuizById, 
  submitQuiz, 
  checkQuizAvailability,
  getQuizLeaderboard,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  toggleQuizActive,
  getQuizSubmissions
} = require('../controllers/quizController');
const { auth, studentAuth, adminAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to all routes
// router.use(apiLimiter);

// Public routes (no auth required for users)
router.get('/', getQuizzes);
router.get('/:id', getQuizById);
router.post('/:id/submit', submitQuiz); // No studentAuth - anyone can submit
router.get('/:id/availability', checkQuizAvailability);
router.get('/:id/leaderboard', getQuizLeaderboard);

// Admin routes (require auth middleware)
router.post('/', auth, createQuiz);
router.put('/:id', auth, updateQuiz);
router.delete('/:id', auth, deleteQuiz);
router.patch('/:id/toggle-active', auth, toggleQuizActive);
router.get('/:id/submissions', auth, getQuizSubmissions);

module.exports = router;