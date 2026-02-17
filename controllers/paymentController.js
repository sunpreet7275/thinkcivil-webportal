// controllers/paymentController.js
const Payment = require('../models/Payment');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const { handleError } = require('../middleware/errorHandler');
const { PLANS } = require('../config/plans');

// Process payment with Razorpay
const processPayment = async (req, res) => {
  try {
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      planId,
      amount,
      couponCode,
      discountAmount 
    } = req.body;
    
    const userId = req.user._id;

    // Validate payment data
    if (!planId || !amount) {
      return res.status(400).json({ 
        message: 'All payment fields are required' 
      });
    }

    // Validate plan type
    const validPlans = ['pre', 'mains', 'combo'];
    if (!validPlans.includes(planId)) {
      return res.status(400).json({ 
        message: 'Invalid plan selected' 
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // If user already has the same plan, prevent duplicate payment
    if (user.type === planId) {
      return res.status(400).json({ 
        message: `You already have an active ${planId.toUpperCase()} plan` 
      });
    }

    // Get plan details
    const plan = PLANS[planId.toUpperCase()];
    if (!plan) {
      return res.status(400).json({ 
        message: 'Invalid plan' 
      });
    }

    // Create payment record
    const payment = new Payment({
      user: userId,
      plan: planId,
      planName: plan.name,
      amount: amount,
      status: 'completed',
      paymentMethod: 'razorpay',
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
      coupon: couponCode ? {
        code: couponCode,
        discountAmount: discountAmount || 0
      } : null,
      paymentGatewayResponse: {
        success: true,
        status: 'captured',
        timestamp: new Date().toISOString()
      }
    });

    await payment.save();

    // Update coupon usage if coupon was applied
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon) {
        coupon.usedCount += 1;
        coupon.usedBy.push({
          user: userId,
          usedAt: new Date(),
          orderId: payment._id.toString(),
          paymentId: razorpay_payment_id
        });
        await coupon.save();
      }
    }

    // Update user type based on the purchased plan
    user.type = planId;
    user.planActivatedAt = new Date();
    user.planExpiryAt = null; // Lifetime access
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Payment successful! Your plan has been activated.',
      payment: {
        id: payment._id,
        transactionId: payment._id,
        plan: payment.plan,
        planName: payment.planName,
        amount: payment.amount,
        status: payment.status,
        couponCode: payment.coupon?.code,
        discountAmount: payment.coupon?.discountAmount
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        type: user.type
      }
    });

  } catch (error) {
    handleError(res, error, 'Payment processing failed');
  }
};

// Activate free plan
const activateFreePlan = async (req, res) => {
  try {
    const { planId, planName, couponCode, userId, isFree } = req.body;

    // Verify the coupon is valid and free
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      isFree: true,
      validUntil: { $gte: new Date() }
    });

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired free coupon'
      });
    }

    // Check if user has already used this coupon
    const hasUsedCoupon = coupon.usedBy.some(entry => 
      entry.user && entry.user.toString() === userId
    );

    if (hasUsedCoupon) {
      return res.status(400).json({
        success: false,
        message: 'You have already used this free coupon'
      });
    }

    // Check if user has already claimed any free plan
    const hasFreePlan = await Payment.exists({
      user: userId,
      'coupon.isFree': true,
      status: 'completed'
    });

    if (hasFreePlan) {
      return res.status(400).json({
        success: false,
        message: 'You have already claimed a free plan. Each user can only claim one free plan.'
      });
    }

    // Get plan details
    const plan = PLANS[planId.toUpperCase()];
    if (!plan) {
      return res.status(400).json({ 
        message: 'Invalid plan' 
      });
    }

    // Create payment record for free plan
    const payment = new Payment({
      user: userId,
      plan: planId,
      planName: plan.name,
      amount: 0,
      status: 'completed',
      paymentMethod: 'free_coupon',
      coupon: {
        code: coupon.code,
        discountType: 'percentage',
        discountValue: 100,
        isFree: true,
        discountAmount: plan.totalAmount
      },
      paymentGatewayResponse: {
        success: true,
        status: 'free_activation',
        timestamp: new Date().toISOString()
      }
    });

    await payment.save();

    // Update coupon usage
    coupon.usedCount += 1;
    coupon.usedBy.push({
      user: userId,
      usedAt: new Date(),
      orderId: payment._id.toString()
    });
    await coupon.save();

    // Update user's plan
    await User.findByIdAndUpdate(userId, {
      type: planId,
      planActivatedAt: new Date(),
      planExpiryAt: null // Lifetime access
    });

    res.json({
      success: true,
      message: 'Free plan activated successfully',
      payment: {
        id: payment._id,
        plan: payment.plan,
        planName: payment.planName,
        status: payment.status,
        isFree: true
      }
    });

  } catch (error) {
    handleError(res, error, 'Failed to activate free plan');
  }
};

// Create Razorpay order
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;
    
    // Initialize Razorpay
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SCRsqadpelzm0v',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'VqhziyZY7pb5RMhlqtkT3FVD'
    });

    const options = {
      amount: amount,
      currency: currency || 'INR',
      receipt: receipt,
      notes: notes
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      id: order.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Verify Razorpay payment
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      planId,
      amount,
      couponCode,
      discountAmount
    } = req.body;

    const crypto = require('crypto');
    const secret = process.env.RAZORPAY_KEY_SECRET || 'VqhziyZY7pb5RMhlqtkT3FVD';

    // Generate signature for verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    // Verify signature
    if (expectedSignature === razorpay_signature) {
      // Payment is verified - process the payment
      req.body.planId = planId;
      req.body.amount = amount;
      req.body.couponCode = couponCode;
      req.body.discountAmount = discountAmount;
      
      // Call processPayment function
      return await processPayment(req, res);
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get payment history for user
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const payments = await Payment.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('plan planName amount status coupon createdAt razorpayPaymentId');

    res.json({
      payments,
      total: payments.length
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch payment history');
  }
};

// Get all payments (admin only)
const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const payments = await Payment.find(filter)
      .populate('user', 'name email phone type')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch payments');
  }
};

// Get single payment details
const getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email phone type');

    if (!payment) {
      return res.status(404).json({ 
        message: 'Payment not found' 
      });
    }

    // Only allow users to view their own payments unless admin
    if (req.user.role !== 'admin' && payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied' 
      });
    }

    res.json(payment);
  } catch (error) {
    handleError(res, error, 'Failed to fetch payment details');
  }
};

module.exports = {
  processPayment,
  activateFreePlan,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentHistory,
  getAllPayments,
  getPaymentDetails
};