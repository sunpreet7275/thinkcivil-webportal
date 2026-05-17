// routes/moduleRoutes.js
const express = require('express');
const router = express.Router();
const {
  createModule,
  getModules,
  updateModule,
  deleteModule,
  toggleModuleStatus,
  getAllActiveModules,
  updateModuleOrder
} = require('../controllers/moduleController');
const { auth, adminAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Public route (no auth required)
router.get('/public', getAllActiveModules);

// Apply authentication to all routes after public
router.use(auth, apiLimiter);

// Admin routes - no multer needed anymore
router.post('/', adminAuth, createModule);
router.get('/admin', adminAuth, getModules);
router.put('/:id', adminAuth, updateModule);
router.delete('/:id', adminAuth, deleteModule);
router.patch('/:id/toggle-status', adminAuth, toggleModuleStatus);
router.patch('/:id/order', adminAuth, updateModuleOrder);

module.exports = router;