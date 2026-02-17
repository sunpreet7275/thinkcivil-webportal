const express = require('express');
const router = express.Router();
const { 
  createDemoTest,
  getDemoTests,
  updateDemoTest,
  deleteDemoTest,
  toggleDemoTestStatus,
  getAvailableDemoTests,
  getDemoTestById,
  submitDemoTest,
  checkDemoTestAvailability,
  getStudentDemoTestResult,
  getStudentDemoResults
} = require('../controllers/demoTestController');
const { auth, adminAuth, studentAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply auth to all routes
router.use(auth);

// Admin routes (admin only) - /api/demo-tests/admin
router.post('/admin', adminAuth, createDemoTest);
router.get('/admin', adminAuth, getDemoTests);
router.put('/admin/:id', adminAuth, updateDemoTest);
router.delete('/admin/:id', adminAuth, deleteDemoTest);
router.patch('/admin/:id/toggle-status', adminAuth, toggleDemoTestStatus);

// Public demo test routes (both admin and student) - /api/demo-tests/
router.get('/available', getAvailableDemoTests); // Both can see available tests
router.get('/:id', getDemoTestById); // Both can view test details

// Student submission routes (student only) - /api/demo-tests/
router.post('/:id/submit', studentAuth, submitDemoTest);
router.get('/:id/availability', checkDemoTestAvailability);
router.get('/:testId/result', getStudentDemoTestResult);
router.get('/student/results', getStudentDemoResults);

module.exports = router;