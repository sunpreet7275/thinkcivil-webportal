const express = require('express');
const router = express.Router();
const {
  createModule,
  createFolder,
  createFile,
  getModules,
  getDirectoryTree,
  getModuleTree,
  updateFile,
  updateModule,
  renameItem,
  deleteItem,
  // Public view methods
  getPublicModules,
  getPublicDirectoryTree,
  getPublicModuleTree,
  getPublicFile
} = require('../controllers/freeResourceController');
const { auth } = require('../middleware/auth');

// ========================
// PUBLIC VIEW ROUTES (No auth required)
// ========================

// Get all public modules
router.get('/public/modules', getPublicModules);

// Get public directory tree
router.get('/public/tree', getPublicDirectoryTree);

// Get complete public module tree
router.get('/public/modules/:id/tree', getPublicModuleTree);

// Get specific file info (for preview)
router.get('/public/files/:id', getPublicFile);

// ========================
// ADMIN ROUTES (Auth required)
// ========================

// All admin routes require authentication
router.use(auth);

// Create new module
router.post('/modules', createModule);

// Create folder inside module/folder
router.post('/folders', createFolder);

// Create file inside module/folder
router.post('/files', createFile);

// Get all modules (admin view with permissions)
router.get('/modules', getModules);

// Get directory tree (for current location)
router.get('/tree', getDirectoryTree);

// Get complete module tree (with all children)
router.get('/modules/:id/tree', getModuleTree);

// Update file
router.put('/files/:id', updateFile);

// Update module
router.put('/modules/:id', updateModule);

// Rename folder/file (not module)
router.put('/items/:id/rename', renameItem);

// Delete any item (module/folder/file)
router.delete('/items/:id', deleteItem);

module.exports = router;