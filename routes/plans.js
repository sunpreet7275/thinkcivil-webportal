const express = require('express');
const router = express.Router();
const { getPlans, getPlanDetails } = require('../controllers/planController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getPlans);
router.get('/:planName', auth, getPlanDetails);

module.exports = router;