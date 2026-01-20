const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./utils/logger');
const initializeAdmin = require('./utils/initializeAdmin');

const app = express();




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


// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'ThinkCivil Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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