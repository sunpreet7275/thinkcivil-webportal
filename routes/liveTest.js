// routes/liveTest.js
const express = require('express');
const router = express.Router();
const liveTestController = require('../controllers/liveTestController');
const { auth, adminAuth } = require('../middleware/auth');

// ============================================
// ADMIN ROUTES
// ============================================

// Create a new live test
router.post('/', auth, adminAuth, liveTestController.createLiveTest);

// Get all live tests (admin)
router.get('/admin', auth, adminAuth, liveTestController.getAllLiveTests);

// Get single live test
router.get('/:id', auth, adminAuth, liveTestController.getLiveTestById);

// Update live test
router.put('/:id', auth, adminAuth, liveTestController.updateLiveTest);

// Toggle live test status
router.patch('/:id/toggle-status', auth, adminAuth, liveTestController.toggleLiveTestStatus);

// Delete live test
router.delete('/:id', auth, adminAuth, liveTestController.deleteLiveTest);

// ============================================
// STUDENT ROUTES
// ============================================

// Get all tests with status (available, upcoming, expired)
router.get('/student/all', auth, liveTestController.getAvailableTests);

// Get only currently available tests
router.get('/student/available', auth, liveTestController.getCurrentlyAvailableTests);

// Get upcoming tests for students
router.get('/student/upcoming', auth, liveTestController.getUpcomingTests);

module.exports = router;