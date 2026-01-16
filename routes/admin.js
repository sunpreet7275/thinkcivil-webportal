const express = require('express');
const router = express.Router();
const {
  createTest,
  getTests,
  updateTest,
  deleteTest,
  getTestResults,
  getTestAnalytics,
  getAllResults,
  getPlatformStatistics,
  getStudents,
  updateUserType,
  getUsersByType,
  deleteUser
} = require('../controllers/adminController');
const { auth, adminAuth } = require('../middleware/auth');
const { testValidation, handleValidationErrors } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(auth, adminAuth, apiLimiter);

// Test Management
router.post('/tests', testValidation, handleValidationErrors, createTest);
router.get('/tests', getTests);
router.put('/tests/:id', testValidation, updateTest);
router.delete('/tests/:id', deleteTest);

// Results & Analytics
router.get('/results/:testId', getTestResults);
router.get('/analytics/:testId', getTestAnalytics);
router.get('/results', getAllResults);
router.get('/statistics', getPlatformStatistics);

// Student Management
router.get('/students', getStudents);
router.delete('/users/:id', auth, adminAuth, deleteUser);

// User Management Routes
router.put('/users/:userId/type', updateUserType);
router.get('/users', getUsersByType);

module.exports = router;