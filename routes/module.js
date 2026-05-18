// routes/module.js
const express = require('express');
const router = express.Router();
const {
  // Module operations
  createModule,
  updateModule,
  getModules,
  deleteModule,
  toggleModuleStatus,
  updateModuleOrder,
  getAllActiveModules,
  // Directory operations
  createFolder,
  createFile,
  getDirectoryContents,
  getItem,
  updateFile,
  renameFolder,
  deleteDirectoryItem,
  // Public APIs
  getPublicDirectoryTree,
  getPublicModuleTree,
  getPublicFile
} = require('../controllers/moduleController');
const { auth, adminAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// ============ Public Routes (No Auth Required) ============
router.get('/public', getAllActiveModules);
router.get('/public/directory', getPublicDirectoryTree);
router.get('/public/module-tree/:id', getPublicModuleTree);
router.get('/public/file/:id', getPublicFile);

// ============ Admin Routes (require auth) ============
router.use(auth, apiLimiter);

// Module CRUD
router.post('/', adminAuth, createModule);
router.get('/admin', adminAuth, getModules);  // Keep as /admin for existing code
router.put('/:id', adminAuth, updateModule);
router.delete('/:id', adminAuth, deleteModule);
router.patch('/:id/toggle-status', adminAuth, toggleModuleStatus);
router.patch('/:id/order', adminAuth, updateModuleOrder);

// Directory operations
router.post('/folders', adminAuth, createFolder);
router.post('/files', adminAuth, createFile);
router.get('/directory/:parentId', adminAuth, getDirectoryContents);
router.get('/item/:id', adminAuth, getItem);
router.put('/files/:id', adminAuth, updateFile);
router.put('/folders/:id', adminAuth, renameFolder);
router.delete('/directory/:id', adminAuth, deleteDirectoryItem);

module.exports = router;