const express = require('express');
const router = express.Router();
const {
  createMentorshipProgram,
  getAllMentorshipProgramsAdmin,
  getActiveMentorshipPrograms,
  getMentorshipProgramById,
  updateMentorshipProgram,
  deleteMentorshipProgram,
  toggleProgramStatus
} = require('../controllers/mentorshipController');
const { auth, adminAuth } = require('../middleware/auth');

// Public routes
router.get('/', getActiveMentorshipPrograms);
router.get('/:id', getMentorshipProgramById);

// Admin routes (protected)
router.use(auth, adminAuth);

router.post('/', createMentorshipProgram);
router.get('/admin/all', getAllMentorshipProgramsAdmin);
router.put('/:id', updateMentorshipProgram);
router.delete('/:id', deleteMentorshipProgram);
router.patch('/:id/toggle-status', toggleProgramStatus);

module.exports = router;