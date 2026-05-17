const express = require('express');
const router = express.Router();
const {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  getProgramsGroupedByCategory,
  bulkCreatePrograms
} = require('../controllers/programController');

// Public routes
router.get('/', getPrograms);
router.get('/grouped/by-category', getProgramsGroupedByCategory);
router.get('/:id', getProgramById);

// Admin routes (you can add authentication middleware here)
router.post('/', createProgram);
router.post('/bulk', bulkCreatePrograms);
router.put('/:id', updateProgram);
router.delete('/:id', deleteProgram);

module.exports = router;