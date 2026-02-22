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

// All routes require authentication
router.use(auth);

// Payment order creation
router.post('/create-order', apiLimiter, createRazorpayOrder);

// Payment verification
router.post('/verify-payment', apiLimiter, verifyRazorpayPayment);

// Free plan activation
router.post('/activate-free-plan', apiLimiter, activateFreePlan);

// User payment routes
router.post('/process', apiLimiter, processPayment);
router.get('/history', apiLimiter, getPaymentHistory);
router.get('/:id', apiLimiter, getPaymentDetails);

// Admin routes
router.get('/admin/all', adminAuth, apiLimiter, getAllPayments);

module.exports = router;