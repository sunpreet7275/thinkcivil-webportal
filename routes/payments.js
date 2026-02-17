// routes/payment.js
const express = require('express');
const router = express.Router();
const {
  processPayment,
  activateFreePlan,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentHistory,
  getAllPayments,
  getPaymentDetails
} = require('../controllers/paymentController');
const { auth, adminAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Payment order creation
router.post('/create-order', auth, apiLimiter, createRazorpayOrder);

// Payment verification
router.post('/verify-payment', auth, apiLimiter, verifyRazorpayPayment);

// Free plan activation
router.post('/activate-free-plan', auth, apiLimiter, activateFreePlan);

// User payment routes
router.post('/process', auth, apiLimiter, processPayment);
router.get('/history', auth, apiLimiter, getPaymentHistory);
router.get('/:id', auth, apiLimiter, getPaymentDetails);

// Admin payment routes
router.get('/admin/all', auth, adminAuth, apiLimiter, getAllPayments);

module.exports = router;