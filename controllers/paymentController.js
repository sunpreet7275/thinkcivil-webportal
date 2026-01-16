const Payment = require('../models/Payment');
const User = require('../models/User');
const { handleError } = require('../middleware/errorHandler');

const processPayment = async (req, res) => {
  try {
    const { plan, bank, amount, baseAmount, gst } = req.body;
    const userId = req.user._id;

    // Validate payment data
    if (!plan || !bank || !amount || !baseAmount || !gst) {
      return res.status(400).json({ message: 'All payment fields are required' });
    }

    // Validate plan type
    const validPlans = ['pre', 'mains', 'combo'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user already has the same plan, prevent duplicate payment
    if (user.type === plan) {
      return res.status(400).json({ 
        message: `You already have an active ${plan.toUpperCase()} plan` 
      });
    }

    // Simulate payment gateway integration
    const paymentResult = await simulatePaymentGateway({
      amount,
      bank,
      plan
    });

    if (paymentResult.success) {
      // Create payment record
      const payment = new Payment({
        user: userId,
        plan,
        bank,
        amount,
        baseAmount,
        gst,
        status: 'completed',
        paymentGatewayResponse: paymentResult
      });

      await payment.save();

      // Update user type based on the purchased plan
      user.type = plan;
      await user.save();

      res.status(200).json({
        message: 'Payment successful! Your plan has been activated.',
        payment: {
          id: payment._id,
          transactionId: payment.transactionId,
          plan: payment.plan,
          amount: payment.amount,
          status: payment.status
        },
        user: user.toJSON()
      });
    } else {
      // Payment failed
      const payment = new Payment({
        user: userId,
        plan,
        bank,
        amount,
        baseAmount,
        gst,
        status: 'failed',
        paymentGatewayResponse: paymentResult
      });

      await payment.save();

      res.status(400).json({
        message: 'Payment failed. Please try again.',
        error: paymentResult.error
      });
    }

  } catch (error) {
    handleError(res, error, 'Payment processing failed');
  }
};

// Simulate payment gateway
const simulatePaymentGateway = async (paymentData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate 95% success rate
      const isSuccess = Math.random() > 0.05;
      
      if (isSuccess) {
        resolve({
          success: true,
          gatewayTransactionId: `GTW${Date.now()}`,
          status: 'captured',
          timestamp: new Date().toISOString()
        });
      } else {
        resolve({
          success: false,
          error: 'Payment gateway timeout',
          status: 'failed'
        });
      }
    }, 2000);
  });
};

const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const payments = await Payment.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('plan amount status transactionId createdAt');

    res.json({
      payments,
      total: payments.length
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch payment history');
  }
};

const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const payments = await Payment.find(filter)
      .populate('user', 'fullName email phone')
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

const getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'fullName email phone type');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Only allow users to view their own payments unless admin
    if (req.user.role !== 'admin' && payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(payment);
  } catch (error) {
    handleError(res, error, 'Failed to fetch payment details');
  }
};

module.exports = {
  processPayment,
  getPaymentHistory,
  getAllPayments,
  getPaymentDetails
};