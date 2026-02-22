const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./utils/logger');
const initializeAdmin = require('./utils/initializeAdmin');

const app = express();

const razorpay = new Razorpay({
  key_id: 'rzp_test_SCRsqadpelzm0v',
  key_secret: 'VqhziyZY7pb5RMhlqtkT3FVD'
});


// Connect to MongoDB
connectDB();


// const cors = require('cors');

// const allowedOrigins = [
//   'https://thinkcivilias.com',
//   'https://www.thinkcivilias.com',
//   'https://admin.thinkcivilias.com'
// ];

// app.use(cors({
//   origin: function (origin, callback) {
//     // allow server-to-server or Postman requests
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('CORS not allowed'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));


// app.options('*', cors());

app.use(cors());

app.use(express.json({limit: '10mb'})); // Increase limit for file uploads
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/results', require('./routes/results'));
app.use('/api/admin', require('./routes/admin'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/results', require('./routes/results'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/plans', require('./routes/plans'));
// Add this to your server.js file
app.use('/api/syllabus', require('./routes/syllabus'));
app.use('/api/tags', require('./routes/tags'));

// Add this to your server.js routes
app.use('/api/questions', require('./routes/questions'));

app.use('/api/pdf', require('./routes/pdf'));
app.use('/api/directories', require('./routes/directory')); // Added directory routes
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/admin/results', require('./routes/results'));


app.use('/api/chat', require('./routes/chat'));
// Add after other route imports
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/announcements', require('./routes/announcement'));

// Add this to your Express app configuration
app.use('/api/topicwiseDirectory', require('./routes/topicwiseDirectory'));

app.use('/api/videoLecture', require('./routes/videoLecture'));

app.use('/api/freeResource', require('./routes/freeResource'));

app.use('/api/simpleNews', require('./routes/simpleNews'));

// Add this to your app.js or server.js
app.use('/api/live-content', require('./routes/liveContent'));

app.use('/api/demo-tests', require('./routes/demoTest'));

app.use('/api/quizzes', require('./routes/quiz'));

app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;
    
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
});

// Verify Payment Endpoint
app.post('/api/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      plan,
      amount,
      gst
    } = req.body;

    // Generate signature for verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', 'VqhziyZY7pb5RMhlqtkT3FVD')
      .update(body.toString())
      .digest('hex');

    // Verify signature
    if (expectedSignature === razorpay_signature) {
      // Payment is verified
      // Here you can:
      // 1. Update user subscription in database
      // 2. Send confirmation email
      // 3. Update order status
      // 4. Generate invoice
      
      res.json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        plan: plan
      });
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
});

app.use('/api/coupons', require('./routes/coupon'));

app.use('/api/config', require('./routes/config'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'ThinkCivil Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Add this temporary endpoint to verify orders
// Add this to your backend for debugging
app.get('/api/verify-order/:orderId', async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    
    const order = await razorpay.orders.fetch(req.params.orderId);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status
      }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Order not found in Razorpay',
      error: error.message
    });
  }
});

// Add to your main server file (app.js/server.js)
app.get('/api/debug/payment-config', (req, res) => {
  // Only for debugging - remove in production
  const keyId = process.env.RAZORPAY_KEY_ID;
  res.json({
    keyId: keyId ? keyId.substring(0, 10) + '...' : 'Not set',
    keyExists: !!keyId,
    secretExists: !!process.env.RAZORPAY_KEY_SECRET,
    environment: process.env.NODE_ENV || 'development',
    // Don't send the actual secret
  });
});

// Add to your server.js or app.js
app.get('/api/debug/razorpay-keys', (req, res) => {
  // ONLY FOR DEBUGGING - REMOVE IN PRODUCTION
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  res.json({
    keyIdExists: !!keyId,
    keyIdPrefix: keyId ? keyId.substring(0, 7) : null,
    keyIdLength: keyId ? keyId.length : 0,
    keySecretExists: !!keySecret,
    keySecretLength: keySecret ? keySecret.length : 0,
    nodeEnv: process.env.NODE_ENV,
    // Don't send actual keys
  });
});




// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize admin user
  initializeAdmin();
});