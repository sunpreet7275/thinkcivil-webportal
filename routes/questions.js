const express = require('express');
const router = express.Router();
const {
  createQuestions,
  getQuestions,
  getQuestionByUid,
  getQuestionsByTag,
  updateQuestion,
  deleteQuestion,
  getAllQuestions
} = require('../controllers/questionController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', auth, adminAuth, getQuestions);
router.get('/all', auth, adminAuth, getAllQuestions);

router.get('/:uid', auth, adminAuth, getQuestionByUid);
router.get('/tag/:tagId', auth, adminAuth, getQuestionsByTag);

router.post('/', auth, adminAuth, createQuestions);
router.put('/:uid', auth, adminAuth, updateQuestion);
router.delete('/:uid', auth, adminAuth, deleteQuestion);

module.exports = router;