const express = require('express');
const router = express.Router();
const {
  processPayment,
  getPaymentHistory,
  getAllPayments,
  getPaymentDetails
} = require('../controllers/paymentController');
const { auth, adminAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// User payment routes
router.post('/process', auth, apiLimiter, processPayment);
router.get('/history', auth, apiLimiter, getPaymentHistory);
router.get('/:id', auth, apiLimiter, getPaymentDetails);

// Admin payment routes
router.get('/admin/all', auth, adminAuth, apiLimiter, getAllPayments);

module.exports = router;